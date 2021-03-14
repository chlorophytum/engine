import { Decl } from "../../tr/decl";
import { TrInvoke } from "../../tr/exp/invoke";
import { TrParameter } from "../../tr/exp/parameter";
import { ProgramDef, GlobalScope, ProgramScope } from "../../tr/scope";
import { TrExprStmt } from "../../tr/stmt/expr";
import { TrSeq } from "../../tr/stmt/sequence";
import { TrStmt } from "../../tr/tr";
import { CompatibleType, Expr } from "../expr";
import { castLiteral, ExprImpl } from "../expr-impl/expr";
import { FuncScopeProxy, ProgramScopeProxy } from "../scope-proxy";
import { Stmt } from "../stmt";
import { AnyStmt, castExprStmt } from "../stmt-impl/branch";
import { TT } from "../type-system";

import { createIdentifier, Identifiable } from "./id-generator";

type WrapExprOrLiteral<Ts extends TT[]> = { [K in keyof Ts]: CompatibleType<Ts[K]> | Expr<Ts[K]> };
type WrapExpr<Ts extends TT[]> = { [K in keyof Ts]: Expr<Ts[K]> };

type RawCallableFunc<Ts extends TT[], Tr extends TT> = (...xs: WrapExprOrLiteral<Ts>) => Expr<Tr>;
type CallableFunc<Ts extends TT[], Tr extends TT> = ProgramDef &
	RawCallableFunc<Ts, Tr> & {
		def: (fb: FuncBody<Ts, Tr>) => CallableFunc<Ts, Tr>;
	};

type RawCallableProc<Ts extends TT[]> = (...xs: WrapExprOrLiteral<Ts>) => Stmt;
type CallableProc<Ts extends TT[]> = ProgramDef &
	RawCallableProc<Ts> & {
		returns: <Tr extends TT>(t: Tr) => CallableFunc<Ts, Tr>;
		def: (fp: ProcBody<Ts>) => CallableProc<Ts>;
	};

type FuncBody<Ts extends TT[], Tr extends TT> = (
	pps: FuncScopeProxy<Tr>,
	...params: WrapExpr<Ts>
) => Iterable<AnyStmt>;
type ProcBody<Ts extends TT[]> = (
	pps: ProgramScopeProxy,
	...params: WrapExpr<Ts>
) => Iterable<AnyStmt>;

export function template<IDs extends Identifiable[], R>(fnDef: (...ids: IDs) => R) {
	const cache = new Map<string, R>();
	return function (...ids: IDs): R {
		const key = createIdentifier(ids);
		const cached = cache.get(key);
		if (cached) return cached;
		const computed = fnDef(...ids);
		cache.set(key, computed);
		return computed;
	};
}

export function func<Ts extends TT[]>(...parameterSig: Ts): CallableProc<Ts> {
	const decl = new ProcedureDeclaration(parameterSig);
	const callable = Object.assign((...xs: WrapExprOrLiteral<Ts>) => decl.createCall(xs), {
		populateInterface: (gs: GlobalScope) => decl.populateInterface(gs),
		populateDefinition: (gs: GlobalScope) => decl.populateDefinition(gs),
		def: (fb: ProcBody<Ts>) => ((decl.body = fb), callable),
		returns: <Tr extends TT>(tr: Tr) => funcDef(parameterSig, tr)
	});
	return callable;
}

function funcDef<Ts extends TT[], Tr extends TT>(parameterSig: Ts, ret: Tr): CallableFunc<Ts, Tr> {
	const decl = new FunctionDeclaration(parameterSig, ret);
	const callable = Object.assign((...xs: WrapExprOrLiteral<Ts>) => decl.createCall(xs), {
		populateInterface: (gs: GlobalScope) => decl.populateInterface(gs),
		populateDefinition: (gs: GlobalScope) => decl.populateDefinition(gs),
		def: (fb: FuncBody<Ts, Tr>) => ((decl.body = fb), callable)
	});
	return callable;
}

class FunctionDeclaration<Ts extends TT[], Tr extends TT> implements ProgramDef {
	constructor(public readonly argumentTypes: Ts, public readonly returnType: Tr) {}
	public body: null | FuncBody<Ts, Tr> = null;
	private readonly m_symbol = Symbol();

	populateInterface(gs: GlobalScope) {
		populateInterfaceImpl(gs, this.m_symbol, this);
		return this.m_symbol;
	}
	populateDefinition(gs: GlobalScope): [ProgramScope, TrStmt] {
		if (!this.body)
			throw new TypeError("Attempt to populate a function before its body is set.");

		const ps = new ProgramScope(gs, false);
		const pps = new FuncScopeProxy<Tr>(ps);

		const params = initParams(ps, this.argumentTypes) as WrapExpr<Ts>;
		const sBody = Array.from(this.body(pps, ...params)).map(x => castExprStmt(x).tr);
		const trBody = new TrSeq(true, sBody).asFunctionBody(ps);
		return [ps, trBody];
	}
	createCall(args: (number | boolean | Expr<TT>)[]): Expr<Tr> {
		return ExprImpl.create(this.returnType, createCallImpl(this, this.argumentTypes, args, 1));
	}
}

class ProcedureDeclaration<Ts extends TT[]> implements ProgramDef {
	constructor(public readonly argumentTypes: Ts) {}
	public body: null | ProcBody<Ts> = null;
	private readonly m_symbol = Symbol();

	populateInterface(gs: GlobalScope) {
		populateInterfaceImpl(gs, this.m_symbol, this);
		return this.m_symbol;
	}
	populateDefinition(gs: GlobalScope): [ProgramScope, TrStmt] {
		if (!this.body)
			throw new TypeError("Attempt to populate a function before its body is set.");

		const ps = new ProgramScope(gs, true);
		const pps = new ProgramScopeProxy(ps);

		const params = initParams(ps, this.argumentTypes) as WrapExpr<Ts>;
		const sBody = Array.from(this.body(pps, ...params)).map(x => castExprStmt(x).tr);
		const trBody = new TrSeq(true, sBody).asFunctionBody(ps);
		return [ps, trBody];
	}
	createCall(args: (number | boolean | Expr<TT>)[]) {
		return new Stmt(new TrExprStmt(createCallImpl(this, this.argumentTypes, args, 0)));
	}
}

function populateInterfaceImpl(gs: GlobalScope, s: symbol, decl: ProgramDef) {
	if (!gs.fpgm.haveDeclared(s)) {
		gs.fpgm.declare(1, s);
		gs.fpgm.setDef(s, decl);
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
