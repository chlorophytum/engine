import { BinaryExpression, NullaryExpression, UnaryExpression } from "../ast/expression/arith";
import { cExpr } from "../ast/expression/constant";
import { InvokeExpression } from "../ast/expression/invoke";
import { ArrayIndex, ArrayInit, CoercedVariable } from "../ast/expression/pointer";
import {
	ControlValueAccessor,
	FunctionVariable,
	VariableAccessor,
	VariableFactory,
	VariableSet
} from "../ast/expression/variable";
import { Expression, PointerExpression, Statement, Variable } from "../ast/interface";
import { AssemblyStatement } from "../ast/statement/assembly";
import { ProgramBeginStatement } from "../ast/statement/begin";
import {
	AlternativeStatement,
	DoWhileStatement,
	IfStatement,
	WhileStatement
} from "../ast/statement/branch";
import { GCExpression, SCFSStatement } from "../ast/statement/coord";
import { DeltaStatement } from "../ast/statement/deltas";
import { GraphStateStatement, GraphStateStatement1 } from "../ast/statement/graph-state";
import { LIp, LMdap, LMdrp, LMiap, LMirp } from "../ast/statement/move-point";
import { ReturnStatement } from "../ast/statement/return";
import { SequenceStatement } from "../ast/statement/sequence";
import { InstrFormat, InstrSink, TTI } from "../instr";
import Assembler from "../ir";
import { GlobalScope, ProgramScope, TtFunctionScopeSolver, TtSymbol } from "../scope";

import { mxapFunctionSys, mxrpFunctionSys } from "./flags";
import { TtStat } from "./stat";

function createFuncScopeSolver(store: EdslProgramStore): TtFunctionScopeSolver<Variable> {
	return {
		resolve(v: Variable) {
			const fr = store.fpgm.get(v);
			if (fr) return fr.scope;
			else return undefined;
		}
	};
}

export class EdslGlobal {
	readonly scope: GlobalScope<Variable>;
	constructor(private readonly stat?: TtStat) {
		this.scope = new GlobalScope(VariableFactory);
		this.scope.funcScopeSolver = createFuncScopeSolver(this.store);
		if (stat) {
			this.scope.fpgm.base = stat.maxFunctionDefs || 0;
			this.scope.twilights.base = stat.maxTwilightPoints || 0;
			this.scope.storages.base = stat.maxStorage || 0;
		}
	}

	store: EdslProgramStore = {
		fpgm: new Map()
	};

	declareFunction(name: string) {
		return this.scope.fpgm.declare(name);
	}

	defineFunction(name: string | Variable, G: (f: EdslProgram) => Iterable<Statement>) {
		const vFunc: Variable = typeof name === "string" ? this.declareFunction(name) : name;
		const existing = this.store.fpgm.get(vFunc);
		if (existing) return vFunc;

		const ls = this.scope.createFunctionScope(vFunc);
		const edsl = new EdslProgram(this, ls);
		const block = new SequenceStatement(G(edsl));
		block.addLastReturn(ls);
		this.store.fpgm.set(vFunc, { scope: ls, program: block });
		return vFunc;
	}

	defineAssemblyFunction(
		name: string | Variable,
		argsArity: number,
		returnArity: number,
		asm: (a: Assembler) => void
	) {
		const vFunc: Variable = typeof name === "string" ? this.declareFunction(name) : name;
		const existing = this.store.fpgm.get(vFunc);
		if (existing) return vFunc;

		const ls = this.scope.createFunctionScope(vFunc);
		ls.returnArity = returnArity;
		for (let j = 0; j < argsArity; j++) ls.arguments.declare();
		const block = new AssemblyStatement(ls, asm);
		this.store.fpgm.set(vFunc, { scope: ls, program: block });
		return vFunc;
	}

	program(G: (f: EdslProgram) => Iterable<Statement>): EdslProgramRecord {
		const ls = this.scope.createProgramScope();
		const edsl = new EdslProgram(this, ls);
		const block = new SequenceStatement([new ProgramBeginStatement(ls), ...G(edsl)]);
		return { scope: ls, program: block };
	}

	private beginCompilation() {
		this.scope.assignID();
	}

	private compileFunction<R>(v: Variable, insSink: InstrSink<R>): R {
		const fpgmRec = this.store.fpgm.get(v);
		if (!fpgmRec) {
			insSink.reset();
			return insSink.getResult();
		}

		const { scope: ls, program: funcProgram } = fpgmRec;
		ls.assignID();
		const asm = new Assembler();
		asm.push(v)
			.prim(TTI.FDEF)
			.deleted(1);
		if (funcProgram instanceof AssemblyStatement) {
			asm.added(ls.arguments.size);
			funcProgram.refer(asm);
			funcProgram.compile(asm);
		} else {
			ls.return = asm.createLabel();
			const h0 = asm.blockBegin();
			funcProgram.refer(asm);
			funcProgram.compile(asm);
			asm.blockEnd(h0 + (ls.returnArity || 0));
			asm.blockEnd(h0 + (ls.returnArity || 0), ls.return);
		}
		asm.prim(TTI.ENDF);

		ls.maxStack = asm.maxStackHeight;
		this.updateStat(ls);
		return asm.codeGen(insSink);
	}

	compileFunctions<R>(format: InstrFormat<R>): Map<Variable, R> {
		this.beginCompilation();
		let m = new Map<Variable, R>();
		for (let loop = 0; loop < 16; loop++) {
			for (const v of this.store.fpgm.keys()) {
				m.set(v, this.compileFunction(v, format.createSink()));
			}
		}
		return m;
	}

	compileProgram<R>(p: EdslProgramRecord, format: InstrFormat<R>): R {
		p.scope.assignID();
		const asm = new Assembler();
		p.program.refer(asm);
		p.program.compile(asm);
		p.scope.maxStack = asm.maxStackHeight;
		this.updateStat(p.scope);
		return asm.codeGen(format.createSink());
	}

	private updateStat<V extends TtSymbol>(ls: ProgramScope<V>) {
		if (!this.stat) return;
		this.stat.maxFunctionDefs = Math.max(
			this.stat.maxFunctionDefs || 0,
			this.scope.fpgm.base + this.scope.fpgm.size
		);
		this.stat.stackHeight = Math.max(
			this.stat.stackHeight || 0,
			ls.maxStack * (this.stat.stackHeightMultiplier || 1)
		);
		this.stat.maxTwilightPoints = Math.max(
			this.stat.maxTwilightPoints || 0,
			ls.twilights.base + ls.twilights.size
		);
		this.stat.maxStorage = Math.max(this.stat.maxStorage || 0, ls.locals.base + ls.locals.size);
	}

	mangleTemplateName(base: string, ...parts: (number | number[])[]) {
		return `${base}<${parts.map(t => JSON.stringify(t)).join(",")}>`;
	}
}

export interface EdslProgramStore {
	fpgm: Map<Variable, EdslProgramRecord>;
}

export interface EdslProgramRecord {
	scope: ProgramScope<Variable>;
	program: Statement;
}

export class EdslProgram {
	constructor(private readonly globalDsl: EdslGlobal, readonly scope: ProgramScope<Variable>) {}
	args(n: number) {
		if (!this.scope.isFunction) throw new TypeError("Cannot declare arguments for programs");
		let a: Variable[] = [];
		for (let j = 0; j < n; j++) a[j] = this.scope.arguments.declare();
		this.scope.arguments.lock();
		return a;
	}
	local(size = 1) {
		return this.scope.locals.declare(size);
	}
	twilight() {
		if (this.scope.isFunction) throw new TypeError("Cannot declare twilights for functions");
		return this.scope.twilights.declare();
	}
	part(a: Variable, b: number | Expression) {
		return new ArrayIndex(a, b);
	}

	// Flow control
	return(...expr: (number | Expression)[]) {
		const ret = new ReturnStatement(this.scope, expr);
		if (this.scope.returnArity === undefined) {
			this.scope.returnArity = ret.getArgsArity();
		}
		return ret;
	}
	if(
		condition: number | Expression,
		consequent: () => Iterable<Statement>,
		alternate?: () => Iterable<Statement>
	) {
		if (alternate) {
			return new IfStatement(
				condition,
				new AlternativeStatement(consequent()),
				new AlternativeStatement(alternate())
			);
		} else {
			return new IfStatement(condition, new AlternativeStatement(consequent()));
		}
	}
	while(condition: number | Expression, consequent: () => Iterable<Statement>) {
		return new WhileStatement(condition, new AlternativeStatement(consequent()));
	}
	do(consequent: () => Iterable<Statement>) {
		return {
			while(condition: number | Expression) {
				return new DoWhileStatement(new AlternativeStatement(consequent()), condition);
			}
		};
	}

	// Assignments
	set = (a: Variable, x: number | Expression) => new VariableSet(a, x);
	setArr = (a: Variable, x: Iterable<number | Expression>) => new ArrayInit(a.ptr, x);

	// Graphics
	mdap = mxapFunctionSys((r: boolean, x: number | Expression) => new LMdap(this.scope, r, x));
	miap = mxapFunctionSys(
		(r: boolean, x: number | Expression, cv: number | PointerExpression) =>
			new LMiap(this.scope, r, x, cv)
	);
	mdrp = mxrpFunctionSys(
		(
			rp0: boolean,
			minDist: boolean,
			round: boolean,
			distanceMode: 0 | 1 | 2 | 3,
			p0: number | Expression,
			p1: number | Expression
		) => new LMdrp(this.scope, rp0, minDist, round, distanceMode, p0, p1)
	);
	mirp = mxrpFunctionSys(
		(
			rp0: boolean,
			minDist: boolean,
			round: boolean,
			distanceMode: 0 | 1 | 2 | 3,
			p0: number | Expression,
			p1: number | Expression,
			cv: number | PointerExpression
		) => new LMirp(this.scope, rp0, minDist, round, distanceMode, p0, p1, cv)
	);
	ip = (p1: number | Expression, p2: number | Expression, ...p: (number | Expression)[]) =>
		new LIp(this.scope, p1, p2, p);

	// Binary
	add = (a: number | Expression, b: number | Expression) => BinaryExpression.Add(a, b);
	sub = (a: number | Expression, b: number | Expression) => BinaryExpression.Sub(a, b);
	mul = (a: number | Expression, b: number | Expression) => BinaryExpression.Mul(a, b);
	div = (a: number | Expression, b: number | Expression) => BinaryExpression.Div(a, b);
	max = (a: number | Expression, b: number | Expression) => BinaryExpression.Max(a, b);
	min = (a: number | Expression, b: number | Expression) => BinaryExpression.Min(a, b);
	lt = (a: number | Expression, b: number | Expression) => BinaryExpression.Lt(a, b);
	lteq = (a: number | Expression, b: number | Expression) => BinaryExpression.Lteq(a, b);
	gt = (a: number | Expression, b: number | Expression) => BinaryExpression.Gt(a, b);
	gteq = (a: number | Expression, b: number | Expression) => BinaryExpression.Gteq(a, b);
	eq = (a: number | Expression, b: number | Expression) => BinaryExpression.Eq(a, b);
	neq = (a: number | Expression, b: number | Expression) => BinaryExpression.Neq(a, b);
	and = (a: number | Expression, b: number | Expression) => BinaryExpression.And(a, b);
	or = (a: number | Expression, b: number | Expression) => BinaryExpression.Or(a, b);

	// Unary
	abs = (a: number | Expression) => new UnaryExpression(TTI.ABS, a, a => Math.abs(a));
	neg = (a: number | Expression) => new UnaryExpression(TTI.NEG, a, a => -a);
	floor = (a: number | Expression) =>
		new UnaryExpression(TTI.FLOOR, a, a => Math.floor(a / 64) * 64);
	ceiling = (a: number | Expression) =>
		new UnaryExpression(TTI.CEILING, a, a => Math.ceil(a / 64) * 64);
	even = (a: number | Expression) => new UnaryExpression(TTI.EVEN, a);
	odd = (a: number | Expression) => new UnaryExpression(TTI.ODD, a);
	not = (a: number | Expression) => new UnaryExpression(TTI.NOT, a, a => (a ? 0 : 1));
	round = {
		gray: (a: number | Expression) => new UnaryExpression(TTI.ROUND_Grey, a),
		black: (a: number | Expression) => new UnaryExpression(TTI.ROUND_Black, a),
		white: (a: number | Expression) => new UnaryExpression(TTI.ROUND_White, a),
		mode3: (a: number | Expression) => new UnaryExpression(TTI.ROUND_Undef4, a)
	};
	nRound = {
		gray: (a: number | Expression) => new UnaryExpression(TTI.NROUND_Grey, a),
		black: (a: number | Expression) => new UnaryExpression(TTI.NROUND_Black, a),
		white: (a: number | Expression) => new UnaryExpression(TTI.NROUND_White, a),
		mode3: (a: number | Expression) => new UnaryExpression(TTI.NROUND_Undef4, a)
	};
	getInfo = (a: number | Expression) => new UnaryExpression(TTI.GETINFO, a);
	gc = {
		cur: (a: number | Expression) => new GCExpression(a, TTI.GC_cur, this.scope),
		orig: (a: number | Expression) => new GCExpression(a, TTI.GC_orig, this.scope)
	};

	//
	scfs = (a: number | Expression, b: number | Expression) => new SCFSStatement(a, b, this.scope);

	// Calls
	apply(fn: Variable, parts: Iterable<number | Expression>) {
		return new InvokeExpression(this.scope, fn, parts);
	}
	call(T: Variable | EdslFunctionTemplateInst, ...parts: (number | Expression)[]) {
		if (T instanceof Function) {
			return new InvokeExpression(this.scope, T(this.globalDsl), parts);
		} else {
			return new InvokeExpression(this.scope, T, parts);
		}
	}

	rawState = {
		szp0: (a: number | Expression) => new GraphStateStatement1(TTI.SZP0, a),
		szp1: (a: number | Expression) => new GraphStateStatement1(TTI.SZP1, a),
		szp2: (a: number | Expression) => new GraphStateStatement1(TTI.SZP2, a)
	};

	// Deltas
	delta = {
		p1: (...a: ([number | Expression, number | Expression])[]) =>
			new DeltaStatement(this.scope, TTI.DELTAP1, true, a.map(x => x[0]), a.map(x => x[1])),
		p2: (...a: ([number | Expression, number | Expression])[]) =>
			new DeltaStatement(this.scope, TTI.DELTAP2, true, a.map(x => x[0]), a.map(x => x[1])),
		p3: (...a: ([number | Expression, number | Expression])[]) =>
			new DeltaStatement(this.scope, TTI.DELTAP3, true, a.map(x => x[0]), a.map(x => x[1])),
		c1: (...a: ([number | PointerExpression, number | Expression])[]) =>
			new DeltaStatement(this.scope, TTI.DELTAC1, false, a.map(x => x[0]), a.map(x => x[1])),
		c2: (...a: ([number | PointerExpression, number | Expression])[]) =>
			new DeltaStatement(this.scope, TTI.DELTAC2, false, a.map(x => x[0]), a.map(x => x[1])),
		c3: (...a: ([number | PointerExpression, number | Expression])[]) =>
			new DeltaStatement(this.scope, TTI.DELTAC3, false, a.map(x => x[0]), a.map(x => x[1]))
	};

	// Measure
	mppem = () => new NullaryExpression(TTI.MPPEM);
	mps = () => new NullaryExpression(TTI.MPS);

	toFloat = (a: number | Expression) => BinaryExpression.Mul(64 * 64, a);

	// GS
	svtca = {
		x: () => new GraphStateStatement(TTI.SVTCA_x),
		y: () => new GraphStateStatement(TTI.SVTCA_y)
	};
	iup = {
		x: () => new GraphStateStatement(TTI.IUP_x),
		y: () => new GraphStateStatement(TTI.IUP_y)
	};

	// Coercions
	coerce = {
		fromIndex: {
			cvt: (e: number | Expression) => new CoercedVariable(cExpr(e), ControlValueAccessor),
			variable: (e: number | Expression, size = 1) =>
				new CoercedVariable(cExpr(e), VariableAccessor, size)
		},
		toF26D6(x: number) {
			return Math.round(x * 64);
		}
	};
}

export type EdslFunctionTemplate<A extends any[]> = (...args: A) => (dsl: EdslGlobal) => Variable;
export type EdslFunctionTemplateInst = (dsl: EdslGlobal) => Variable;

export function EdslDefineFunctionTemplate<A extends (number | number[])[]>(
	name: string,
	G: (e: EdslProgram, ...args: A) => Iterable<Statement>
): EdslFunctionTemplate<A> {
	return (...args: A) => (dsl: EdslGlobal) =>
		dsl.defineFunction(dsl.mangleTemplateName(name, ...args), (e: EdslProgram) =>
			G(e, ...args)
		);
}
export function EdslDefineFunctionTemplateEx<A extends any[]>(
	name: string,
	Identity: (...from: A) => (number | number[])[],
	G: (e: EdslProgram, ...args: A) => Iterable<Statement>
): EdslFunctionTemplate<A> {
	return (...args: A) => {
		const mangleArgs = Identity(...args);
		return (dsl: EdslGlobal) =>
			dsl.defineFunction(dsl.mangleTemplateName(name, ...mangleArgs), (e: EdslProgram) =>
				G(e, ...args)
			);
	};
}
export function EdslDefineLibraryFunction(
	name: string,
	G: (e: EdslProgram) => Iterable<Statement>
): EdslFunctionTemplateInst {
	return (dsl: EdslGlobal) =>
		dsl.defineFunction(dsl.mangleTemplateName(name), (e: EdslProgram) => G(e));
}
