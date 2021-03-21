import { TTI } from "@chlorophytum/hltt-next-backend";
import { Expr, castLiteral, Stmt } from "@chlorophytum/hltt-next-expr-impl";
import { TrDeltas } from "@chlorophytum/hltt-next-tr";
import { Cvt, Int, THandle, TwilightPoint } from "@chlorophytum/hltt-next-type-system";

export const Delta = {
	p1(...a: [Expr<THandle>, number | Expr<Int>][]) {
		return new Stmt(
			new TrDeltas(
				TTI.DELTAP1,
				a.map(([z, d]) => [z.tr, z.type === TwilightPoint, castLiteral(Int, d).tr])
			)
		);
	},
	p2(...a: [Expr<THandle>, number | Expr<Int>][]) {
		return new Stmt(
			new TrDeltas(
				TTI.DELTAP2,
				a.map(([z, d]) => [z.tr, z.type === TwilightPoint, castLiteral(Int, d).tr])
			)
		);
	},
	p3(...a: [Expr<THandle>, number | Expr<Int>][]) {
		return new Stmt(
			new TrDeltas(
				TTI.DELTAP3,
				a.map(([z, d]) => [z.tr, z.type === TwilightPoint, castLiteral(Int, d).tr])
			)
		);
	},
	c1(...a: [Expr<THandle>, number | Expr<Cvt<Int>>][]) {
		return new Stmt(
			new TrDeltas(
				TTI.DELTAC1,
				a.map(([z, d]) => [z.tr, z.type === TwilightPoint, castLiteral(Cvt(Int), d).tr])
			)
		);
	},
	c2(...a: [Expr<THandle>, number | Expr<Cvt<Int>>][]) {
		return new Stmt(
			new TrDeltas(
				TTI.DELTAC2,
				a.map(([z, d]) => [z.tr, z.type === TwilightPoint, castLiteral(Cvt(Int), d).tr])
			)
		);
	},
	c3(...a: [Expr<THandle>, number | Expr<Cvt<Int>>][]) {
		return new Stmt(
			new TrDeltas(
				TTI.DELTAC3,
				a.map(([z, d]) => [z.tr, z.type === TwilightPoint, castLiteral(Cvt(Int), d).tr])
			)
		);
	}
};
