import { Expr, ExprImpl } from "@chlorophytum/hltt-next-expr-impl";
import { TrConst, TrVolatile } from "@chlorophytum/hltt-next-tr";
import { Frac, GlyphPoint, Int, TT, TwilightPoint } from "@chlorophytum/hltt-next-type-system";

export function integer(x: number): Expr<Int> {
	return ExprImpl.create(Int, new TrConst(x));
}

export function fraction(x: number): Expr<Frac> {
	return ExprImpl.create(Frac, new TrConst(x * 64));
}

export function glyphPoint(x: number): Expr<GlyphPoint> {
	return ExprImpl.create(GlyphPoint, new TrConst(x));
}

export function twilightPoint(x: number): Expr<TwilightPoint> {
	return ExprImpl.create(TwilightPoint, new TrConst(x));
}

export function volatile<T extends TT>(x: Expr<T>): Expr<T> {
	return ExprImpl.create(x.type, new TrVolatile(x.tr));
}
