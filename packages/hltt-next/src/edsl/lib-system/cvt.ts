import { Decl, GlobalScope } from "@chlorophytum/hltt-next-tr";

import { CvtExprImpl } from "../expr-impl/expr";
import { TArith } from "../type-system";

export function ControlValue<T extends TArith>(type: T, size: number = 1) {
	return CvtExprImpl.fromDecl(type, new CvDeclaration<T>(type, size));
}

class CvDeclaration<T extends TArith> implements Decl {
	constructor(public readonly type: T, private readonly size: number) {}
	public readonly symbol = Symbol();

	register(gs: GlobalScope) {
		if (!gs.cvt.haveDeclared(this.symbol)) gs.cvt.declare(this.size, this.symbol);
		return this.symbol;
	}
}
