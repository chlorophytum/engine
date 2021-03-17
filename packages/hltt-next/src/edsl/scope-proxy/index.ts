import { ProgramScope, TrReturn } from "@chlorophytum/hltt-next-tr";

import { Expr, ExprVarStore } from "../expr";
import { LocalVarExprImpl } from "../expr-impl/expr";
import { Stmt } from "../stmt";
import { Store, TT } from "../type-system";

export class ProgramScopeProxy {
	constructor(private readonly ps: ProgramScope) {}
	Local<T extends TT>(ty: T, name?: string): Expr<T> & ExprVarStore<T> {
		const sy = this.ps.locals.declare(1, Symbol(name));
		return LocalVarExprImpl.fromSymbol(ty, sy);
	}
	LocalArray<T extends TT>(ty: T, size: number, name?: string): Expr<Store<T>> {
		const sy = this.ps.locals.declare(size, Symbol(name));
		return LocalVarExprImpl.fromSymbol(ty, sy).ptr;
	}
}

export class FuncScopeProxy<Tr extends TT> extends ProgramScopeProxy {
	Return(x: Expr<Tr>) {
		return new Stmt(new TrReturn(x.tr));
	}
}
