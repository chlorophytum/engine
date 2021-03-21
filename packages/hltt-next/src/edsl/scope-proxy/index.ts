import { ProgramScope, TrReturn } from "@chlorophytum/hltt-next-tr";
import { Store, TT } from "@chlorophytum/hltt-next-type-system";

import { CompatibleType, Expr, ExprVarStore } from "../expr";
import { castLiteral, LocalVarExprImpl } from "../expr-impl/expr";
import { Stmt } from "../stmt";

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

export class ProcScopeProxy extends ProgramScopeProxy {
	Exit() {
		return new Stmt(new TrReturn(null));
	}
}

export class FuncScopeProxy<Tr extends TT> extends ProgramScopeProxy {
	constructor(protected readonly returnType: TT, ps: ProgramScope) {
		super(ps);
	}
	Return(x: CompatibleType<Tr> | Expr<Tr>) {
		return new Stmt(new TrReturn(castLiteral(this.returnType, x).tr));
	}
}
