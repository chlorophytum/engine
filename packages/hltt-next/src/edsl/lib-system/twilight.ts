import { Decl, GlobalScope, TrTwilightPointRef } from "@chlorophytum/hltt-next-tr";

import { ExprImpl } from "../expr-impl/expr";
import { TwilightPoint } from "../type-system";

export function Twilight(size: number = 1) {
	return ExprImpl.create(TwilightPoint, new TrTwilightPointRef(new TwilightDeclaration()));
}

class TwilightDeclaration implements Decl {
	constructor() {}
	public readonly symbol = Symbol();

	register(gs: GlobalScope) {
		if (!gs.twilightPoints.haveDeclared(this.symbol)) gs.twilightPoints.declare(1, this.symbol);
		return this.symbol;
	}
}
