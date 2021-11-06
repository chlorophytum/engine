import { Expr } from "@chlorophytum/hltt-next-expr";
import { castLiteral, ExprImpl } from "@chlorophytum/hltt-next-expr-impl";
import { Stmt, AnyStmt, castExprStmt } from "@chlorophytum/hltt-next-stmt";
import {
	Decl,
	GlobalScope,
	ProgramDef,
	ProgramRecord,
	ProgramScope,
	TrExprStmt,
	TrInvoke,
	TrParameter,
	TrSeq,
	TrStmt
} from "@chlorophytum/hltt-next-tr";
import { TT } from "@chlorophytum/hltt-next-type-system";

import { FuncScopeProxy, ProcScopeProxy, ProgramScopeProxy } from "../scope-proxy";

import {
	CallableFunc,
	CallableProc,
	FuncBody,
	ProcBody,
	WrapExpr,
	WrapExprOrLiteral
} from "./interfaces";

export function Func<Ts extends TT[]>(...parameterSig: Ts): CallableProc<Ts> {
	return procDef(null, parameterSig);
}

function procDef<Ts extends TT[]>(debugName: null | string, parameterSig: Ts): CallableProc<Ts> {
	const decl = new ProcedureDeclaration(debugName, parameterSig);
	const callable = Object.assign((...xs: WrapExprOrLiteral<Ts>) => decl.createCall(xs), {
		get symbol() {
			return decl.symbol;
		},
		debugName: (name: string) => procDef(name, parameterSig),
		register: (gs: GlobalScope) => decl.register(gs),
		computeDefinition: (gs: GlobalScope) => decl.computeDefinition(gs),
		def: (fb: ProcBody<Ts>) => ((decl.body = fb), callable),
		returns: <Tr extends TT>(tr: Tr) => funcDef(debugName, parameterSig, tr)
	});
	return callable;
}

function funcDef<Ts extends TT[], Tr extends TT>(
	debugName: null | string,
	parameterSig: Ts,
	ret: Tr
): CallableFunc<Ts, Tr> {
	const decl = new FunctionDeclaration(debugName, parameterSig, ret);
	const callable = Object.assign((...xs: WrapExprOrLiteral<Ts>) => decl.createCall(xs), {
		get symbol() {
			return decl.symbol;
		},
		debugName: (name: string) => funcDef(name, parameterSig, ret),
		register: (gs: GlobalScope) => decl.register(gs),
		computeDefinition: (gs: GlobalScope) => decl.computeDefinition(gs),
		def: (fb: FuncBody<Ts, Tr>) => ((decl.body = fb), callable)
	});
	return callable;
}

class FunctionDeclaration<Ts extends TT[], Tr extends TT> implements ProgramDef {
	public body: null | FuncBody<Ts, Tr> = null;
	public readonly symbol: symbol;

	constructor(
		debugName: null | string,
		public readonly parameterSig: Ts,
		public readonly returnType: Tr
	) {
		this.symbol = Symbol(debugName || undefined);
	}

	register(gs: GlobalScope) {
		populateInterfaceImpl(gs, this.symbol, this);
		return this.symbol;
	}
	computeDefinition(gs: GlobalScope): ProgramRecord {
		if (!this.body)
			throw new TypeError("Attempt to populate a function before its body is set.");

		const ps = new ProgramScope(gs, false);
		const pps = new FuncScopeProxy<Tr>(this.returnType, ps);

		const params = initParams(ps, this.parameterSig) as WrapExpr<Ts>;
		const sBody = Array.from(this.body(pps, ...params)).map(x => castExprStmt(x).tr);
		const trBody = new TrSeq(true, sBody).asFunctionBody(ps);
		return [ps, trBody];
	}
	createCall(args: (number | boolean | Expr<TT>)[]): Expr<Tr> {
		return ExprImpl.create(this.returnType, createCallImpl(this, this.parameterSig, args, 1));
	}
}

class ProcedureDeclaration<Ts extends TT[]> implements ProgramDef {
	public body: null | ProcBody<Ts> = null;
	public readonly symbol: symbol;

	constructor(debugName: null | string, public readonly parameterSig: Ts) {
		this.symbol = Symbol(debugName || undefined);
	}

	register(gs: GlobalScope) {
		populateInterfaceImpl(gs, this.symbol, this);
		return this.symbol;
	}
	computeDefinition(gs: GlobalScope): ProgramRecord {
		if (!this.body)
			throw new TypeError("Attempt to populate a function before its body is set.");

		const ps = new ProgramScope(gs, true);
		const pps = new ProcScopeProxy(ps);

		const params = initParams(ps, this.parameterSig) as WrapExpr<Ts>;
		const sBody = Array.from(this.body(pps, ...params)).map(x => castExprStmt(x).tr);
		const trBody = new TrSeq(true, sBody).asFunctionBody(ps);
		return [ps, trBody];
	}
	createCall(args: (number | boolean | Expr<TT>)[]) {
		return new Stmt(new TrExprStmt(createCallImpl(this, this.parameterSig, args, 0)));
	}
}

export class RootProgramDeclaration {
	constructor(private readonly body: (pps: ProgramScopeProxy) => Iterable<AnyStmt>) {}
	computeDefinition(gs: GlobalScope): ProgramRecord {
		const ps = new ProgramScope(gs, true);
		const pps = new ProgramScopeProxy(ps);
		const sBody = Array.from(this.body(pps)).map(x => castExprStmt(x).tr);
		const trBody = new TrSeq(true, sBody).asRootProgram(ps);
		return [ps, trBody];
	}
}

function populateInterfaceImpl(gs: GlobalScope, s: symbol, decl: ProgramDef) {
	if (!gs.fpgm.haveDeclared(s)) {
		gs.fpgm.declare(1, s);
		gs.fpgm.setDef(s, decl);
		decl.computeDefinition(gs);
	}
}

function createCallImpl(
	decl: Decl,
	argTypes: TT[],
	args: (number | boolean | Expr<TT>)[],
	returnArity: number
) {
	if (args.length !== argTypes.length) throw new TypeError("Arity mismatch");
	const irArgs = args.map((x, i) => castLiteral(argTypes[i], x).tr);
	return new TrInvoke(decl, irArgs, returnArity);
}

function initParams(ps: ProgramScope, argumentTypes: TT[]) {
	const params: Expr<TT>[] = [];
	for (const argTy of argumentTypes) {
		params.push(ExprImpl.create(argTy, new TrParameter(ps.parameters.declare(1, Symbol()))));
	}
	return params;
}

export class StdLibFuncDecl implements ProgramDef {
	constructor(
		public readonly symbol: symbol,
		private readonly entryArity: number,
		private readonly exitArity: number,
		private readonly tr: TrStmt
	) {}

	register(gs: GlobalScope) {
		populateInterfaceImpl(gs, this.symbol, this);
		return this.symbol;
	}
	computeDefinition(gs: GlobalScope): ProgramRecord {
		const ps = new ProgramScope(gs, !this.exitArity);
		return [ps, this.tr];
	}
}
