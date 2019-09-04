import * as stringify from "json-stable-stringify";

import { BinaryExpression, NullaryExpression, UnaryExpression } from "../ast/expression/arith";
import { cExpr } from "../ast/expression/constant";
import { InvokeExpression } from "../ast/expression/invoke";
import { ArrayIndex, ArrayInit, CoercedVariable } from "../ast/expression/pointer";
import {
	ControlValueAccessor,
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
import {
	GraphStateStatement,
	GraphStateStatement1,
	IupStatement
} from "../ast/statement/graph-state";
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
	public readonly scope: GlobalScope<Variable>;
	constructor(private readonly store: EdslProgramStore, private readonly stat: TtStat = {}) {
		this.scope = new GlobalScope(VariableFactory);
		this.scope.funcScopeSolver = createFuncScopeSolver(this.store);
		if (stat) {
			this.scope.fpgm.base = stat.maxFunctionDefs || 0;
			this.scope.twilights.base = stat.maxTwilightPoints || 0;
			this.scope.storages.base = stat.maxStorage || 0;
			this.scope.cvt.base = stat.cvtSize || 0;
		}
	}

	public declareFunction(name: string) {
		return this.scope.fpgm.declare(name);
	}

	public defineFunction(name: string | Variable, G: (f: EdslProgram) => Iterable<Statement>) {
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

	public defineAssemblyFunction(
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

	public program(G: (f: EdslProgram) => Iterable<Statement>): EdslProgramRecord {
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

	public compileFunctions<R>(format: InstrFormat<R>): Map<Variable, R> {
		this.beginCompilation();
		let m = new Map<Variable, R>();
		for (let loop = 0; loop < 16; loop++) {
			for (const v of this.store.fpgm.keys()) {
				m.set(v, this.compileFunction(v, format.createSink()));
			}
		}
		return m;
	}

	public compileProgram<R>(p: EdslProgramRecord, format: InstrFormat<R>): R {
		p.scope.assignID();
		const asm = new Assembler();
		p.program.refer(asm);
		p.program.compile(asm);
		p.scope.maxStack = asm.maxStackHeight;
		this.updateStat(p.scope);
		return asm.codeGen(format.createSink());
	}

	private updateStat<V extends TtSymbol>(ls: ProgramScope<V>) {
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
		this.stat.maxStorage = Math.max(
			this.stat.maxStorage || 0,
			ls.locals.base + ls.locals.size * (this.stat.maxStorageMultiplier || 1)
		);
	}

	public mangleTemplateName(base: string, ...parts: any[]) {
		return `${base}!${stringify(parts)}`;
	}

	public getStats() {
		return this.stat;
	}

	public convertSymbol(T: Variable | EdslSymbol) {
		if (T instanceof Function) {
			return T(this);
		} else {
			return T;
		}
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
	public args(n: number) {
		if (!this.scope.isFunction) throw new TypeError("Cannot declare arguments for programs");
		let a: Variable[] = [];
		for (let j = 0; j < n; j++) a[j] = this.scope.arguments.declare();
		this.scope.arguments.lock();
		return a;
	}
	public local(size = 1) {
		return this.scope.locals.declare(size);
	}
	public globalVariable(name: string, size = 1) {
		return this.globalDsl.scope.storages.declare(name, size);
	}
	public controlValue(name: string, size = 1) {
		return this.globalDsl.scope.cvt.declare(name, size);
	}
	public twilight() {
		if (this.scope.isFunction) throw new TypeError("Cannot declare twilights for functions");
		return this.scope.twilights.declare();
	}
	public globalTwilight(name: string) {
		return this.globalDsl.scope.twilights.declare(name);
	}

	public part(a: Variable, b: number | Expression) {
		return new ArrayIndex(a, b);
	}

	// Flow control
	public return(...expr: (number | Expression)[]) {
		const ret = new ReturnStatement(this.scope, expr);
		if (this.scope.returnArity === undefined) {
			this.scope.returnArity = ret.getArgsArity();
		}
		return ret;
	}
	public if(
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
	public while(condition: number | Expression, consequent: () => Iterable<Statement>) {
		return new WhileStatement(condition, new AlternativeStatement(consequent()));
	}
	public do(consequent: () => Iterable<Statement>) {
		return {
			while(condition: number | Expression) {
				return new DoWhileStatement(new AlternativeStatement(consequent()), condition);
			}
		};
	}

	// Assignments
	public set = (a: Variable, x: number | Expression) => new VariableSet(a, x);
	public setArr = (a: Variable, x: Iterable<number | Expression>) => new ArrayInit(a.ptr, x);

	// Graphics
	public mdap = mxapFunctionSys(
		(r: boolean, x: number | Expression) => new LMdap(this.scope, r, x)
	);
	public miap = mxapFunctionSys(
		(r: boolean, x: number | Expression, cv: number | PointerExpression) =>
			new LMiap(this.scope, r, x, cv)
	);
	public mdrp = mxrpFunctionSys(
		(
			rp0: boolean,
			minDist: boolean,
			round: boolean,
			distanceMode: 0 | 1 | 2 | 3,
			p0: number | Expression,
			p1: number | Expression
		) => new LMdrp(this.scope, rp0, minDist, round, distanceMode, p0, p1)
	);
	public mirp = mxrpFunctionSys(
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
	public ip = (p1: number | Expression, p2: number | Expression, ...p: (number | Expression)[]) =>
		new LIp(this.scope, p1, p2, p);

	// Binary
	public add = (a: number | Expression, b: number | Expression) => BinaryExpression.Add(a, b);
	public sub = (a: number | Expression, b: number | Expression) => BinaryExpression.Sub(a, b);
	public mul = (a: number | Expression, b: number | Expression) => BinaryExpression.Mul(a, b);
	public div = (a: number | Expression, b: number | Expression) => BinaryExpression.Div(a, b);
	public max = (a: number | Expression, b: number | Expression) => BinaryExpression.Max(a, b);
	public min = (a: number | Expression, b: number | Expression) => BinaryExpression.Min(a, b);
	public lt = (a: number | Expression, b: number | Expression) => BinaryExpression.Lt(a, b);
	public lteq = (a: number | Expression, b: number | Expression) => BinaryExpression.Lteq(a, b);
	public gt = (a: number | Expression, b: number | Expression) => BinaryExpression.Gt(a, b);
	public gteq = (a: number | Expression, b: number | Expression) => BinaryExpression.Gteq(a, b);
	public eq = (a: number | Expression, b: number | Expression) => BinaryExpression.Eq(a, b);
	public neq = (a: number | Expression, b: number | Expression) => BinaryExpression.Neq(a, b);
	public and = (a: number | Expression, b: number | Expression) => BinaryExpression.And(a, b);
	public or = (a: number | Expression, b: number | Expression) => BinaryExpression.Or(a, b);

	// Unary
	public abs = (a: number | Expression) => new UnaryExpression(TTI.ABS, a, a => Math.abs(a));
	public neg = (a: number | Expression) => new UnaryExpression(TTI.NEG, a, a => -a);
	public floor = (a: number | Expression) =>
		new UnaryExpression(TTI.FLOOR, a, a => Math.floor(a / 64) * 64);
	public ceiling = (a: number | Expression) =>
		new UnaryExpression(TTI.CEILING, a, a => Math.ceil(a / 64) * 64);
	public even = (a: number | Expression) => new UnaryExpression(TTI.EVEN, a);
	public odd = (a: number | Expression) => new UnaryExpression(TTI.ODD, a);
	public not = (a: number | Expression) => new UnaryExpression(TTI.NOT, a, a => (a ? 0 : 1));
	public round = {
		gray: (a: number | Expression) => new UnaryExpression(TTI.ROUND_Grey, a),
		black: (a: number | Expression) => new UnaryExpression(TTI.ROUND_Black, a),
		white: (a: number | Expression) => new UnaryExpression(TTI.ROUND_White, a),
		mode3: (a: number | Expression) => new UnaryExpression(TTI.ROUND_Undef4, a)
	};
	public nRound = {
		gray: (a: number | Expression) => new UnaryExpression(TTI.NROUND_Grey, a),
		black: (a: number | Expression) => new UnaryExpression(TTI.NROUND_Black, a),
		white: (a: number | Expression) => new UnaryExpression(TTI.NROUND_White, a),
		mode3: (a: number | Expression) => new UnaryExpression(TTI.NROUND_Undef4, a)
	};
	public getInfo = (a: number | Expression) => new UnaryExpression(TTI.GETINFO, a);
	public gc = {
		cur: (a: number | Expression) => new GCExpression(a, TTI.GC_cur, this.scope),
		orig: (a: number | Expression) => new GCExpression(a, TTI.GC_orig, this.scope)
	};

	//
	public scfs = (a: number | Expression, b: number | Expression) =>
		new SCFSStatement(a, b, this.scope);

	// Calls
	public apply(fn: Variable, parts: Iterable<number | Expression>) {
		return new InvokeExpression(this.scope, fn, parts);
	}
	public symbol(T: Variable | EdslSymbol) {
		if (T instanceof Function) {
			return T(this.globalDsl);
		} else {
			return T;
		}
	}
	public call(T: Variable | EdslSymbol, ...parts: (number | Expression)[]) {
		if (T instanceof Function) {
			return new InvokeExpression(this.scope, T(this.globalDsl), parts);
		} else {
			return new InvokeExpression(this.scope, T, parts);
		}
	}

	public rawState = {
		szp0: (a: number | Expression) => new GraphStateStatement1(TTI.SZP0, a),
		szp1: (a: number | Expression) => new GraphStateStatement1(TTI.SZP1, a),
		szp2: (a: number | Expression) => new GraphStateStatement1(TTI.SZP2, a)
	};

	// Deltas
	public delta = {
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
	public mppem = () => new NullaryExpression(TTI.MPPEM);
	public mps = () => new NullaryExpression(TTI.MPS);

	public toFloat = (a: number | Expression) => BinaryExpression.Mul(64 * 64, a);

	// GS
	public svtca = {
		x: () => new GraphStateStatement(TTI.SVTCA_x),
		y: () => new GraphStateStatement(TTI.SVTCA_y)
	};
	public iup = {
		x: () => new IupStatement(TTI.IUP_x),
		y: () => new IupStatement(TTI.IUP_y)
	};

	public emptyBlock = () => function*(): Iterable<Statement> {};

	// Coercions
	public coerce = {
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

export type EdslSymbolTemplate<A extends any[]> = (...args: A) => (dsl: EdslGlobal) => Variable;
export type EdslSymbol = (dsl: EdslGlobal) => Variable;

export class EdslLibrary {
	private fid = 0;
	constructor(private readonly namePrefix: string) {}

	private generateFunctionName() {
		return this.namePrefix + `::` + this.fid++;
	}

	public Func(G: (e: EdslProgram) => Iterable<Statement>): EdslSymbol {
		const name = this.generateFunctionName();
		return (dsl: EdslGlobal) =>
			dsl.defineFunction(dsl.mangleTemplateName(name), (e: EdslProgram) => G(e));
	}

	public Template<A extends any[]>(
		G: (e: EdslProgram, ...args: A) => Iterable<Statement>
	): EdslSymbolTemplate<A> {
		const fName = this.generateFunctionName();
		return (...args: A) => (dsl: EdslGlobal) =>
			dsl.defineFunction(dsl.mangleTemplateName(fName, ...args), (e: EdslProgram) =>
				G(e, ...args)
			);
	}

	public TemplateEx<A extends any[]>(
		Identity: (...from: A) => any,
		G: (e: EdslProgram, ...args: A) => Iterable<Statement>
	): EdslSymbolTemplate<A> {
		const name = this.generateFunctionName();
		return (...args: A) => {
			const mangleArgs = Identity(...args);
			return (dsl: EdslGlobal) =>
				dsl.defineFunction(dsl.mangleTemplateName(name, ...mangleArgs), (e: EdslProgram) =>
					G(e, ...args)
				);
		};
	}

	public Twilight(size: number = 1): EdslSymbol {
		const name = this.generateFunctionName();
		return (dsl: EdslGlobal) => dsl.scope.twilights.declare(name, size);
	}
	public TwilightTemplate<A extends any[]>(size: number = 1): EdslSymbolTemplate<A> {
		const name = this.generateFunctionName();
		return (...args: A) => (dsl: EdslGlobal) =>
			dsl.scope.twilights.declare(dsl.mangleTemplateName(name, ...args), size);
	}

	public ControlValue(size: number = 1): EdslSymbol {
		const name = this.generateFunctionName();
		return (dsl: EdslGlobal) => dsl.scope.cvt.declare(name, size);
	}
	public ControlValueTemplate<A extends any[]>(size: number = 1): EdslSymbolTemplate<A> {
		const name = this.generateFunctionName();
		return (...args: A) => (dsl: EdslGlobal) =>
			dsl.scope.cvt.declare(dsl.mangleTemplateName(name, ...args), size);
	}
}
