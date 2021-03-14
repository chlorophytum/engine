import { TTI } from "../../instr";
import { TrDeltas } from "../../tr/stmt/deltas";
import { Expr } from "../expr";
import { Cvt, Int, THandle, TwilightPoint } from "../type-system";

export const Delta = {
	p1(...a: [Expr<THandle>, Expr<Int>][]) {
		return new TrDeltas(
			TTI.DELTAP1,
			a.map(([z, d]) => [z.tr, z.type === TwilightPoint, d.tr])
		);
	},
	p2(...a: [Expr<THandle>, Expr<Int>][]) {
		return new TrDeltas(
			TTI.DELTAP2,
			a.map(([z, d]) => [z.tr, z.type === TwilightPoint, d.tr])
		);
	},
	p3(...a: [Expr<THandle>, Expr<Int>][]) {
		return new TrDeltas(
			TTI.DELTAP3,
			a.map(([z, d]) => [z.tr, z.type === TwilightPoint, d.tr])
		);
	},
	c1(...a: [Expr<THandle>, Expr<Cvt<Int>>][]) {
		return new TrDeltas(
			TTI.DELTAC1,
			a.map(([z, d]) => [z.tr, z.type === TwilightPoint, d.tr])
		);
	},
	c2(...a: [Expr<THandle>, Expr<Cvt<Int>>][]) {
		return new TrDeltas(
			TTI.DELTAC2,
			a.map(([z, d]) => [z.tr, z.type === TwilightPoint, d.tr])
		);
	},
	c3(...a: [Expr<THandle>, Expr<Cvt<Int>>][]) {
		return new TrDeltas(
			TTI.DELTAC3,
			a.map(([z, d]) => [z.tr, z.type === TwilightPoint, d.tr])
		);
	}
};
