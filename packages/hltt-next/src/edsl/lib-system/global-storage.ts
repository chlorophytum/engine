import { ExprVarStore, GlobalVarExprImpl } from "@chlorophytum/hltt-next-expr-impl";
import { Decl, GlobalScope } from "@chlorophytum/hltt-next-tr";
import { TT } from "@chlorophytum/hltt-next-type-system";

export function GlobalStorage<T extends TT>(type: T, size: number = 1): ExprVarStore<T> {
	return GlobalVarExprImpl.fromDecl(type, new GlobalStorageImpl<T>(type, size));
}

class GlobalStorageImpl<T extends TT> implements Decl {
	constructor(public readonly type: T, private readonly size: number) {}
	public readonly symbol = Symbol();

	register(gs: GlobalScope) {
		if (!gs.storage.haveDeclared(this.symbol)) {
			gs.storage.declare(this.size, this.symbol);
		}
		return this.symbol;
	}
}
