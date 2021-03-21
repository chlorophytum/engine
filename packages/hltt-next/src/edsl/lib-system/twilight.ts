import { Expr } from "@chlorophytum/hltt-next-expr";
import { ExprImpl } from "@chlorophytum/hltt-next-expr-impl";
import { Decl, GlobalScope, TrTwilightPointRef } from "@chlorophytum/hltt-next-tr";
import { TwilightPoint } from "@chlorophytum/hltt-next-type-system";

export function Twilight(size: number = 1): Expr<TwilightPoint> {
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
