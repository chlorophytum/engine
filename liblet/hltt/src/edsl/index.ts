import * as stringify from "json-stable-stringify";
import Assembler from "../asm";
import { BinaryExpression, NullaryExpression, UnaryExpression } from "../ast/expression/arith";
import { cExpr } from "../ast/expression/constant";
import { InvokeExpression } from "../ast/expression/invoke";
import {
	ArrayIndex,
	ArrayInit,
	ArrayInitGetVariation,
	CoercedVariable
} from "../ast/expression/pointer";
import { VariableFactory, VariableSet } from "../ast/expression/variable";
import { Expression, PointerExpression, Statement, Variable, VarKind } from "../ast/interface";
import { TtFunctionScopeSolver, TtGlobalScope, TtProgramScope } from "../ast/scope";
import { AssemblyStatement } from "../ast/statement/assembly";
import { ProgramBeginStatement } from "../ast/statement/begin";
import {
	AlternativeStatement,
	DoWhileStatement,
	IfStatement,
	StatementBody,
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
import { VkArgument, VkCvt, VkFpgm, VkStorage, VkTwilight } from "../ast/variable-kinds";
import { InstrFormat, InstrSink, TTI } from "../instr";
import { TtGlobalScopeT, TtSymbol } from "../scope";
import { mxapFunctionSys, mxrpFunctionSys } from "./flags";
import { TtStat } from "./stat";

type NumExpr = number | Expression;

function createFuncScopeSolver(store: EdslProgramStore): TtFunctionScopeSolver {
	return {
		resolve(v: TtSymbol) {
			const fr = store.fpgm.get(v as Variable<VkFpgm>);
			if (fr) return fr.scope;
			else return undefined;
		}
	};
}

export class EdslGlobal {
	public readonly scope: TtGlobalScope;
	constructor(private readonly store: EdslProgramStore, private readonly stat: TtStat = {}) {
		this.scope = new TtGlobalScopeT(VariableFactory);
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

	public defineFunction(
		name: string | Variable<VkFpgm>,
		G: (f: EdslProgram) => Iterable<Statement>
	) {
		const vFunc: Variable<VkFpgm> =
			typeof name === "string" ? this.declareFunction(name) : name;
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
		name: string | Variable<VkFpgm>,
		argsArity: number,
		returnArity: number,
		asm: (a: Assembler) => void
	) {
		const vFunc: Variable<VkFpgm> =
			typeof name === "string" ? this.declareFunction(name) : name;
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

	private compileFunction<R>(v: Variable<VkFpgm>, insSink: InstrSink<R>): R {
		const fpgmRec = this.store.fpgm.get(v);
		if (!fpgmRec) {
			insSink.reset();
			return insSink.getResult();
		}

		const { scope: ls, program: funcProgram } = fpgmRec;
		ls.assignID();
		const asm = new Assembler();
		asm.push(v).prim(TTI.FDEF).deleted(1);
		if (funcProgram instanceof AssemblyStatement) {
			asm.added(ls.arguments.size);
			funcProgram.compile(asm);
		} else {
			ls.return = asm.createLabel();
			const h0 = asm.blockBegin();
			funcProgram.compile(asm);
			asm.blockEnd(h0 + (ls.returnArity || 0));
			asm.blockEnd(h0 + (ls.returnArity || 0), ls.return);
		}
		asm.prim(TTI.ENDF);

		ls.maxStack = asm.maxStackHeight;
		this.updateStat(ls);
		return asm.codeGen(insSink);
	}

	public compileFunctions<R>(format: InstrFormat<R>): Map<Variable<VkFpgm>, R> {
		this.beginCompilation();
		let m = new Map<Variable<VkFpgm>, R>();
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
		p.program.compile(asm);
		p.scope.maxStack = asm.maxStackHeight;
		this.updateStat(p.scope);
		return asm.codeGen(format.createSink());
	}

	private updateStat(ls: TtProgramScope) {
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

	public convertSymbol<A extends VarKind>(T: Variable<A> | EdslSymbol<A>) {
		if (T instanceof Function) {
			return T(this);
		} else {
			return T;
		}
	}
}

export interface EdslProgramStore {
	fpgm: Map<Variable<VkFpgm>, EdslProgramRecord>;
}

export interface EdslProgramRecord {
	scope: TtProgramScope;
	program: Statement;
}

export class EdslProgram {
	constructor(private readonly globalDsl: EdslGlobal, readonly scope: TtProgramScope) {}
	public args(n: number) {
		if (!this.scope.isFunction) throw new TypeError("Cannot declare arguments for programs");
		let a: Variable<VkArgument>[] = [];
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

	public part<A extends VarKind>(a: Variable<A>, b: NumExpr) {
		return new ArrayIndex(a, b);
	}

	// Flow control
	public return(...expr: NumExpr[]) {
		const ret = new ReturnStatement(this.scope, expr);
		if (this.scope.returnArity === undefined) {
			this.scope.returnArity = ret.getArgsArity();
		}
		return ret;
	}
	public begin(...statements: Statement[]) {
		return () => statements;
	}
	public if(condition: NumExpr, FConsequence?: StatementBody, FAlternate?: StatementBody) {
		const consequence = FConsequence ? AlternativeStatement.from(FConsequence) : null;
		const alternate = FAlternate ? AlternativeStatement.from(FAlternate) : null;

		return new IfStatement(condition, consequence, alternate);
	}
	public while(condition: NumExpr, consequent: StatementBody) {
		return new WhileStatement(condition, AlternativeStatement.from(consequent));
	}
	public do(consequent: StatementBody) {
		return {
			while(condition: NumExpr) {
				return new DoWhileStatement(AlternativeStatement.from(consequent), condition);
			}
		};
	}

	// Assignments
	public set = <A extends VarKind>(a: Variable<A>, x: NumExpr) => new VariableSet(a, x);
	public setArr = <A extends VarKind>(a: Variable<A>, x: Iterable<NumExpr>) =>
		new ArrayInit(a.ptr, x);

	// Graphics
	public mdap = mxapFunctionSys((r: boolean, x: NumExpr) => new LMdap(this.scope, r, x));
	public miap = mxapFunctionSys(
		(r: boolean, x: NumExpr, cv: number | PointerExpression<VkCvt>) =>
			new LMiap(this.scope, r, x, cv)
	);
	public mdrp = mxrpFunctionSys(
		(
			rp0: boolean,
			minDist: boolean,
			round: boolean,
			distanceMode: 0 | 1 | 2 | 3,
			p0: NumExpr,
			p1: NumExpr
		) => new LMdrp(this.scope, rp0, minDist, round, distanceMode, p0, p1)
	);
	public mirp = mxrpFunctionSys(
		(
			rp0: boolean,
			minDist: boolean,
			round: boolean,
			distanceMode: 0 | 1 | 2 | 3,
			p0: NumExpr,
			p1: NumExpr,
			cv: number | PointerExpression<VkCvt>
		) => new LMirp(this.scope, rp0, minDist, round, distanceMode, p0, p1, cv)
	);
	public ip = (p1: NumExpr, p2: NumExpr, ...p: NumExpr[]) => new LIp(this.scope, p1, p2, p);

	// Binary
	public add = (a: NumExpr, b: NumExpr) => BinaryExpression.Add(a, b);
	public sub = (a: NumExpr, b: NumExpr) => BinaryExpression.Sub(a, b);
	public mul = (a: NumExpr, b: NumExpr) => BinaryExpression.Mul(a, b);
	public div = (a: NumExpr, b: NumExpr) => BinaryExpression.Div(a, b);
	public max = (a: NumExpr, b: NumExpr) => BinaryExpression.Max(a, b);
	public min = (a: NumExpr, b: NumExpr) => BinaryExpression.Min(a, b);
	public lt = (a: NumExpr, b: NumExpr) => BinaryExpression.Lt(a, b);
	public lteq = (a: NumExpr, b: NumExpr) => BinaryExpression.Lteq(a, b);
	public gt = (a: NumExpr, b: NumExpr) => BinaryExpression.Gt(a, b);
	public gteq = (a: NumExpr, b: NumExpr) => BinaryExpression.Gteq(a, b);
	public eq = (a: NumExpr, b: NumExpr) => BinaryExpression.Eq(a, b);
	public neq = (a: NumExpr, b: NumExpr) => BinaryExpression.Neq(a, b);
	public and = (a: NumExpr, b: NumExpr) => BinaryExpression.And(a, b);
	public or = (a: NumExpr, b: NumExpr) => BinaryExpression.Or(a, b);

	public addSet = <A extends VarKind>(a: Variable<A>, x: NumExpr) =>
		new VariableSet(a, BinaryExpression.Add(a, x));
	public subSet = <A extends VarKind>(a: Variable<A>, x: NumExpr) =>
		new VariableSet(a, BinaryExpression.Sub(a, x));
	public mulSet = <A extends VarKind>(a: Variable<A>, x: NumExpr) =>
		new VariableSet(a, BinaryExpression.Mul(a, x));
	public divSet = <A extends VarKind>(a: Variable<A>, x: NumExpr) =>
		new VariableSet(a, BinaryExpression.Div(a, x));

	// Unary
	public abs = (a: NumExpr) => new UnaryExpression(TTI.ABS, a, a => Math.abs(a));
	public neg = (a: NumExpr) => new UnaryExpression(TTI.NEG, a, a => -a);
	public floor = (a: NumExpr) => new UnaryExpression(TTI.FLOOR, a, a => Math.floor(a / 64) * 64);
	public ceiling = (a: NumExpr) =>
		new UnaryExpression(TTI.CEILING, a, a => Math.ceil(a / 64) * 64);
	public even = (a: NumExpr) => new UnaryExpression(TTI.EVEN, a);
	public odd = (a: NumExpr) => new UnaryExpression(TTI.ODD, a);
	public not = (a: NumExpr) => new UnaryExpression(TTI.NOT, a, a => (a ? 0 : 1));
	public round = {
		gray: (a: NumExpr) => new UnaryExpression(TTI.ROUND_Grey, a),
		black: (a: NumExpr) => new UnaryExpression(TTI.ROUND_Black, a),
		white: (a: NumExpr) => new UnaryExpression(TTI.ROUND_White, a),
		mode3: (a: NumExpr) => new UnaryExpression(TTI.ROUND_Undef4, a)
	};
	public nRound = {
		gray: (a: NumExpr) => new UnaryExpression(TTI.NROUND_Grey, a),
		black: (a: NumExpr) => new UnaryExpression(TTI.NROUND_Black, a),
		white: (a: NumExpr) => new UnaryExpression(TTI.NROUND_White, a),
		mode3: (a: NumExpr) => new UnaryExpression(TTI.NROUND_Undef4, a)
	};
	public getInfo = (a: NumExpr) => new UnaryExpression(TTI.GETINFO, a);
	public gc = {
		cur: (a: NumExpr) => new GCExpression(a, TTI.GC_cur, this.scope),
		orig: (a: NumExpr) => new GCExpression(a, TTI.GC_orig, this.scope)
	};

	//
	public scfs = (a: NumExpr, b: NumExpr) => new SCFSStatement(a, b, this.scope);

	// Calls
	public apply(fn: Variable<VkFpgm>, parts: Iterable<NumExpr>) {
		return new InvokeExpression(this.scope, fn, parts);
	}
	public symbol<A extends VarKind>(T: Variable<A> | EdslSymbol<A>) {
		if (T instanceof Function) {
			return T(this.globalDsl);
		} else {
			return T;
		}
	}
	public call(T: Variable<VkFpgm> | EdslSymbol<VkFpgm>, ...parts: NumExpr[]) {
		if (T instanceof Function) {
			return new InvokeExpression(this.scope, T(this.globalDsl), parts);
		} else {
			return new InvokeExpression(this.scope, T, parts);
		}
	}

	public rawState = {
		szp0: (a: NumExpr) => new GraphStateStatement1(TTI.SZP0, a),
		szp1: (a: NumExpr) => new GraphStateStatement1(TTI.SZP1, a),
		szp2: (a: NumExpr) => new GraphStateStatement1(TTI.SZP2, a)
	};

	// Deltas
	public delta = {
		p1: (...a: [NumExpr, NumExpr][]) =>
			new DeltaStatement(
				this.scope,
				TTI.DELTAP1,
				true,
				a.map(x => x[0]),
				a.map(x => x[1])
			),
		p2: (...a: [NumExpr, NumExpr][]) =>
			new DeltaStatement(
				this.scope,
				TTI.DELTAP2,
				true,
				a.map(x => x[0]),
				a.map(x => x[1])
			),
		p3: (...a: [NumExpr, NumExpr][]) =>
			new DeltaStatement(
				this.scope,
				TTI.DELTAP3,
				true,
				a.map(x => x[0]),
				a.map(x => x[1])
			),
		c1: (...a: [number | PointerExpression<VkCvt>, NumExpr][]) =>
			new DeltaStatement(
				this.scope,
				TTI.DELTAC1,
				false,
				a.map(x => x[0]),
				a.map(x => x[1])
			),
		c2: (...a: [number | PointerExpression<VkCvt>, NumExpr][]) =>
			new DeltaStatement(
				this.scope,
				TTI.DELTAC2,
				false,
				a.map(x => x[0]),
				a.map(x => x[1])
			),
		c3: (...a: [number | PointerExpression<VkCvt>, NumExpr][]) =>
			new DeltaStatement(
				this.scope,
				TTI.DELTAC3,
				false,
				a.map(x => x[0]),
				a.map(x => x[1])
			)
	};

	// Measure
	public mppem = () => new NullaryExpression(TTI.MPPEM);
	public mps = () => new NullaryExpression(TTI.MPS);

	public toFloat = (a: NumExpr) => BinaryExpression.Mul(64 * 64, a);

	// GS
	public svtca = {
		x: () => new GraphStateStatement(TTI.SVTCA_x),
		y: () => new GraphStateStatement(TTI.SVTCA_y)
	};
	public iup = {
		x: () => new IupStatement(TTI.IUP_x),
		y: () => new IupStatement(TTI.IUP_y)
	};

	// GetVariation
	public getVariationDimensionCount() {
		return this.globalDsl.getStats().varDimensionCount || 0;
	}
	public getVariation<A extends VarKind>(a: Variable<A>) {
		return new ArrayInitGetVariation(a.ptr, this.getVariationDimensionCount());
	}

	// NOP
	public emptyBlock = () => function* (): Iterable<Statement> {};

	// Coercions
	public coerce = {
		fromIndex: {
			cvt: (e: NumExpr) => new CoercedVariable<VkCvt>(cExpr(e), new VkCvt()),
			variable: (e: NumExpr, size = 1) =>
				new CoercedVariable<VkStorage>(cExpr(e), new VkStorage(), size)
		},
		toF26D6(x: number) {
			return Math.round(x * 64);
		}
	};
}

export type EdslTemplate<Ax extends VarKind, A extends any[]> = (
	...args: A
) => (dsl: EdslGlobal) => Variable<Ax>;
export type EdslSymbol<Ax extends VarKind> = (dsl: EdslGlobal) => Variable<Ax>;

export class EdslLibrary {
	private fid = 0;
	constructor(private readonly namePrefix: string) {}

	private generateFunctionName() {
		return this.namePrefix + `::` + this.fid++;
	}

	public Func(G: (e: EdslProgram) => Iterable<Statement>): EdslSymbol<VkFpgm> {
		const name = this.generateFunctionName();
		return (dsl: EdslGlobal) =>
			dsl.defineFunction(dsl.mangleTemplateName(name), (e: EdslProgram) => G(e));
	}

	public Template<A extends any[]>(
		G: (e: EdslProgram, ...args: A) => Iterable<Statement>
	): EdslTemplate<VkFpgm, A> {
		const fName = this.generateFunctionName();
		return (...args: A) => (dsl: EdslGlobal) =>
			dsl.defineFunction(dsl.mangleTemplateName(fName, ...args), (e: EdslProgram) =>
				G(e, ...args)
			);
	}

	public TemplateEx<A extends any[]>(
		Identity: (...from: A) => any,
		G: (e: EdslProgram, ...args: A) => Iterable<Statement>
	): EdslTemplate<VkFpgm, A> {
		const name = this.generateFunctionName();
		return (...args: A) => {
			const mangleArgs = Identity(...args);
			return (dsl: EdslGlobal) =>
				dsl.defineFunction(dsl.mangleTemplateName(name, ...mangleArgs), (e: EdslProgram) =>
					G(e, ...args)
				);
		};
	}

	public Twilight(size: number = 1): EdslSymbol<VkTwilight> {
		const name = this.generateFunctionName();
		return (dsl: EdslGlobal) => dsl.scope.twilights.declare(name, size);
	}
	public TwilightTemplate<A extends any[]>(size: number = 1): EdslTemplate<VkTwilight, A> {
		const name = this.generateFunctionName();
		return (...args: A) => (dsl: EdslGlobal) =>
			dsl.scope.twilights.declare(dsl.mangleTemplateName(name, ...args), size);
	}

	public ControlValue(size: number = 1): EdslSymbol<VkCvt> {
		const name = this.generateFunctionName();
		return (dsl: EdslGlobal) => dsl.scope.cvt.declare(name, size);
	}
	public ControlValueTemplate<A extends any[]>(size: number = 1): EdslTemplate<VkCvt, A> {
		const name = this.generateFunctionName();
		return (...args: A) => (dsl: EdslGlobal) =>
			dsl.scope.cvt.declare(dsl.mangleTemplateName(name, ...args), size);
	}
}
