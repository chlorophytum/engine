import { Expr } from "@chlorophytum/hltt-next-expr";
import { CompatibleType } from "@chlorophytum/hltt-next-expr-impl";
import { AnyStmt, Stmt } from "@chlorophytum/hltt-next-stmt";
import { ProgramDef } from "@chlorophytum/hltt-next-tr";
import { TT } from "@chlorophytum/hltt-next-type-system";

import { FuncScopeProxy, ProcScopeProxy } from "../scope-proxy";

export type WrapExprOrLiteral<Ts extends TT[]> = {
	[K in keyof Ts]: CompatibleType<Ts[K]> | Expr<Ts[K]>;
};
export type WrapExpr<Ts extends TT[]> = { [K in keyof Ts]: Expr<Ts[K]> };

export type RawCallableFunc<Ts extends TT[], Tr extends TT> = (
	...xs: WrapExprOrLiteral<Ts>
) => Expr<Tr>;
export type CallableFunc<Ts extends TT[], Tr extends TT> = ProgramDef &
	RawCallableFunc<Ts, Tr> & {
		debugName: (n: string) => CallableFunc<Ts, Tr>;
		def: (fb: FuncBody<Ts, Tr>) => CallableFunc<Ts, Tr>;
	};

export type RawCallableProc<Ts extends TT[]> = (...xs: WrapExprOrLiteral<Ts>) => Stmt;
export type CallableProc<Ts extends TT[]> = ProgramDef &
	RawCallableProc<Ts> & {
		debugName: (n: string) => CallableProc<Ts>;
		returns: <Tr extends TT>(t: Tr) => CallableFunc<Ts, Tr>;
		def: (fp: ProcBody<Ts>) => CallableProc<Ts>;
	};

export type FuncBody<Ts extends TT[], Tr extends TT> = (
	pps: FuncScopeProxy<Tr>,
	...params: WrapExpr<Ts>
) => Iterable<AnyStmt>;
export type ProcBody<Ts extends TT[]> = (
	pps: ProcScopeProxy,
	...params: WrapExpr<Ts>
) => Iterable<AnyStmt>;
