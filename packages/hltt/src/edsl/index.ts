/* eslint-disable @typescript-eslint/no-explicit-any */
import * as stringify from "json-stable-stringify";

import Assembler from "../asm";
import { cExprArr } from "../ast/expression/constant";
import { ArrayIndex, ArrayInitGetVariation } from "../ast/expression/pointer";
import { VariableFactory } from "../ast/expression/variable";
import {
	EdslFunctionScopeSolver,
	EdslGlobalScope,
	EdslProgramScope,
	Expression,
	Statement,
	Variable,
	VarKind,
	VkArgument,
	VkCvt,
	VkFpgm,
	VkTwilight
} from "../ast/interface";
import { AsmStatement } from "../ast/statement/assembly";
import { ProgramBeginStatement } from "../ast/statement/begin";
import {
	AlternativeStatement,
	DoWhileStatement,
	IfStatement,
	StatementBody,
	WhileStatement
} from "../ast/statement/branch";
import { ReturnStatement } from "../ast/statement/return";
import { SequenceStatement } from "../ast/statement/sequence";
import { InstrFormat, InstrSink, TTI } from "../instr";
import { TtGlobalScopeT } from "../scope";

import { DslConstructor, NExpr } from "./expr-ctor";
import { TtStat } from "./stat";

export * from "../ast";

export interface ProgramStore {
	fpgm: Map<Variable<VkFpgm>, ProgramRecord>;
}

export interface ProgramRecord {
	scope: EdslProgramScope;
	program: Statement;
}

class CProgramStoreScopeResolver implements EdslFunctionScopeSolver {
	constructor(private readonly store: ProgramStore) {}
	resolve(v: Variable<VkFpgm>) {
		const fr = this.store.fpgm.get(v);
		if (fr) return fr.scope;
		else return undefined;
	}
}

export class GlobalDsl {
	public readonly scope: EdslGlobalScope;
	constructor(private readonly store: ProgramStore, private readonly stat: TtStat = {}) {
		this.scope = new TtGlobalScopeT(
			VariableFactory,
			new CProgramStoreScopeResolver(this.store)
		);
		this.scope.fpgm.base = stat.maxFunctionDefs || 0;
		this.scope.twilights.base = stat.maxTwilightPoints || 0;
		this.scope.storages.base = stat.maxStorage || 0;
		this.scope.cvt.base = stat.cvtSize || 0;
	}

	public declareFunction(name: string) {
		return this.scope.fpgm.declare(name);
	}

	public defineFunction(
		name: string | Variable<VkFpgm>,
		G: (f: ProgramDsl) => Iterable<Statement>
	) {
		const vFunc: Variable<VkFpgm> =
			typeof name === "string" ? this.declareFunction(name) : name;
		const existing = this.store.fpgm.get(vFunc);
		if (existing) return vFunc;

		const ls = this.scope.createFunctionScope(vFunc);
		const edsl = new ProgramDsl(this, ls);
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
		const block = new AsmStatement(ls, asm);
		this.store.fpgm.set(vFunc, { scope: ls, program: block });
		return vFunc;
	}

	public program(G: (f: ProgramDsl) => Iterable<Statement>): ProgramRecord {
		const ls = this.scope.createProgramScope();
		const edsl = new ProgramDsl(this, ls);
		const block = new SequenceStatement([new ProgramBeginStatement(), ...G(edsl)]);
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
		if (funcProgram instanceof AsmStatement) {
			asm.added(ls.arguments.size);
			funcProgram.compile(asm);
		} else {
			ls.return = asm.createLabel();
			const h0 = asm.blockBegin();
			funcProgram.compile(asm, ls);
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
		const m = new Map<Variable<VkFpgm>, R>();
		for (let loop = 0; loop < 16; loop++) {
			for (const v of this.store.fpgm.keys()) {
				m.set(v, this.compileFunction(v, format.createSink()));
			}
		}
		return m;
	}

	public compileProgram<R>(p: ProgramRecord, format: InstrFormat<R>): R {
		p.scope.assignID();
		const asm = new Assembler();
		p.program.compile(asm, p.scope);
		p.scope.maxStack = asm.maxStackHeight;
		this.updateStat(p.scope);
		return asm.codeGen(format.createSink());
	}

	private updateStat(ls: EdslProgramScope) {
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

	public convertLinkable<A extends VarKind>(T: Variable<A> | Linkable<A>) {
		if (T instanceof Function) {
			return T(this);
		} else {
			return T;
		}
	}
}

export class ProgramDsl extends DslConstructor {
	constructor(private readonly globalDsl: GlobalDsl, readonly scope: EdslProgramScope) {
		super();
	}
	public args(n: number) {
		if (!this.scope.isFunction) throw new TypeError("Cannot declare arguments for programs");
		const a: Variable<VkArgument>[] = [];
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

	public part<A extends VarKind>(a: Variable<A>, b: NExpr) {
		return new ArrayIndex(a, b);
	}

	// Non-inheritable EDSL constructors (mostly scope-dependent)
	// Flow control
	public return(...expr: NExpr[]) {
		const ret = new ReturnStatement(expr);
		if (this.scope.returnArity === undefined) {
			this.scope.returnArity = ret.getArgsArity(this.scope);
		}
		return ret;
	}
	public begin(...statements: Statement[]) {
		return () => statements;
	}
	public if(condition: NExpr, FConsequence?: StatementBody, FAlternate?: StatementBody) {
		const consequence = FConsequence ? AlternativeStatement.from(FConsequence) : null;
		const alternate = FAlternate ? AlternativeStatement.from(FAlternate) : null;

		return new IfStatement(condition, consequence, alternate);
	}
	public while(condition: NExpr, consequent: StatementBody) {
		return new WhileStatement(condition, AlternativeStatement.from(consequent));
	}
	public do(consequent: StatementBody) {
		return {
			while(condition: NExpr) {
				return new DoWhileStatement(AlternativeStatement.from(consequent), condition);
			}
		};
	}

	// Linkable resolution and call
	public Linkable<A extends VarKind>(T: Variable<A> | Linkable<A>): Variable<A> {
		if (T instanceof Function) {
			return T(this.globalDsl);
		} else {
			return T;
		}
	}
	public call(T: Variable<VkFpgm> | Linkable<VkFpgm>, ...parts: NExpr[]): Expression {
		if (T instanceof Function) {
			return this.apply(T(this.globalDsl), cExprArr(parts));
		} else {
			return this.apply(T, cExprArr(parts));
		}
	}

	// Variation
	public getVariationDimensionCount() {
		return this.globalDsl.getStats().varDimensionCount || 0;
	}
	public getVariation<A extends VarKind>(a: Variable<A>): Statement {
		return new ArrayInitGetVariation(a.ptr, this.getVariationDimensionCount());
	}
}

export type Template<Ax extends VarKind, A extends unknown[]> = (...args: A) => Linkable<Ax>;
export type Linkable<Ax extends VarKind> = (dsl: GlobalDsl) => Variable<Ax>;

export class Library {
	private fid = 0;
	constructor(private readonly namePrefix: string) {}

	private generateFunctionName() {
		return this.namePrefix + `::` + this.fid++;
	}

	public Func(G: (e: ProgramDsl) => Iterable<Statement>): Linkable<VkFpgm> {
		const name = this.generateFunctionName();
		return (dsl: GlobalDsl) =>
			dsl.defineFunction(dsl.mangleTemplateName(name), (e: ProgramDsl) => G(e));
	}

	public Template<A extends unknown[]>(
		G: (e: ProgramDsl, ...args: A) => Iterable<Statement>
	): Template<VkFpgm, A> {
		const fName = this.generateFunctionName();
		return (...args: A) => (dsl: GlobalDsl) =>
			dsl.defineFunction(dsl.mangleTemplateName(fName, ...args), (e: ProgramDsl) =>
				G(e, ...args)
			);
	}

	public TemplateEx<A extends unknown[]>(
		Identity: (...from: A) => any,
		G: (e: ProgramDsl, ...args: A) => Iterable<Statement>
	): Template<VkFpgm, A> {
		const name = this.generateFunctionName();
		return (...args: A) => {
			const mangleArgs = Identity(...args);
			return (dsl: GlobalDsl) =>
				dsl.defineFunction(dsl.mangleTemplateName(name, ...mangleArgs), (e: ProgramDsl) =>
					G(e, ...args)
				);
		};
	}

	public Twilight(size: number = 1): Linkable<VkTwilight> {
		const name = this.generateFunctionName();
		return (dsl: GlobalDsl) => dsl.scope.twilights.declare(name, size);
	}
	public TwilightTemplate<A extends unknown[]>(size: number = 1): Template<VkTwilight, A> {
		const name = this.generateFunctionName();
		return (...args: A) => (dsl: GlobalDsl) =>
			dsl.scope.twilights.declare(dsl.mangleTemplateName(name, ...args), size);
	}

	public ControlValue(size: number = 1): Linkable<VkCvt> {
		const name = this.generateFunctionName();
		return (dsl: GlobalDsl) => dsl.scope.cvt.declare(name, size);
	}
	public ControlValueTemplate<A extends unknown[]>(size: number = 1): Template<VkCvt, A> {
		const name = this.generateFunctionName();
		return (...args: A) => (dsl: GlobalDsl) =>
			dsl.scope.cvt.declare(dsl.mangleTemplateName(name, ...args), size);
	}
}
