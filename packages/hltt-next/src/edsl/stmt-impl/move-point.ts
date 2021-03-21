import { TrIp, TrMdap, TrMdrp, TrMiap, TrMirp, TrScfs } from "@chlorophytum/hltt-next-tr";
import { Cvt, Frac, THandle, TwilightPoint } from "@chlorophytum/hltt-next-type-system";

import { Expr } from "../expr";
import { castLiteral } from "../expr-impl/expr";
import { Stmt } from "../stmt";

// EDSL for MDAP and MDRP
export const Mdap = mxapFunctionSys(
	(r, x: Expr<THandle>) => new Stmt(new TrMdap(r, x.tr, x.type === TwilightPoint))
);
export const Miap = mxapFunctionSys(
	(r, x: Expr<THandle>, y: Expr<Cvt<Frac>>) =>
		new Stmt(new TrMiap(r, x.tr, x.type === TwilightPoint, y.tr))
);

export interface MxapConstructor<A extends unknown[]> {
	(round: boolean, ...a: A): Stmt;
}
export interface MxapFnSet<A extends unknown[]> {
	(...a: A): Stmt;
	noRound: MxapFnSet<A>;
	round: MxapFnSet<A>;
}
export interface ReadonlyMxapFnSet<A extends unknown[]> {
	(...a: A): Stmt;
	readonly noRound: ReadonlyMxapFnSet<A>;
	readonly round: ReadonlyMxapFnSet<A>;
}
function MxapT<A extends unknown[], E>(b: boolean, ctor: MxapConstructor<A>) {
	return (...a: A) => ctor(b, ...a);
}

export function mxapFunctionSys<A extends unknown[], E>(
	ctor: MxapConstructor<A>
): ReadonlyMxapFnSet<A> {
	const noRound = (MxapT(false, ctor) as unknown) as MxapFnSet<A>;
	const round = (MxapT(true, ctor) as unknown) as MxapFnSet<A>;
	noRound.round = round.round = round;
	round.noRound = noRound.noRound = noRound;
	return noRound;
}

// EDSL for MDRP and MIRP
export const Mdrp = mxrpFunctionSys(
	(rp0, md, rnd, mode, p0: Expr<THandle>, p1: Expr<THandle>) =>
		new Stmt(
			new TrMdrp(
				rp0,
				md,
				rnd,
				mode,
				p0.tr,
				p0.type === TwilightPoint,
				p1.tr,
				p1.type === TwilightPoint
			)
		)
);
export const Mirp = mxrpFunctionSys(
	(rp0, md, rnd, mode, p0: Expr<THandle>, p1: Expr<THandle>, dist: Expr<Cvt<Frac>>) =>
		new Stmt(
			new TrMirp(
				rp0,
				md,
				rnd,
				mode,
				p0.tr,
				p0.type === TwilightPoint,
				p1.tr,
				p1.type === TwilightPoint,
				dist.tr
			)
		)
);

export interface MxrpConstructor<A extends unknown[]> {
	(rp0: boolean, minDist: boolean, round: boolean, distanceMode: 0 | 1 | 2 | 3, ...a: A): Stmt;
}
export interface MxrpFnSet<A extends unknown[]> {
	(...a: A): Stmt;
	noRp0: MxrpFnSet<A>;
	rp0: MxrpFnSet<A>;
	noMD: MxrpFnSet<A>;
	md: MxrpFnSet<A>;
	noRound: MxrpFnSet<A>;
	round: MxrpFnSet<A>;
	gray: MxrpFnSet<A>;
	black: MxrpFnSet<A>;
	white: MxrpFnSet<A>;
	mode3: MxrpFnSet<A>;
}
export interface ReadonlyMxrpFnSet<A extends unknown[]> {
	(...a: A): Stmt;
	noRp0: ReadonlyMxrpFnSet<A>;
	rp0: ReadonlyMxrpFnSet<A>;
	noMD: ReadonlyMxrpFnSet<A>;
	md: ReadonlyMxrpFnSet<A>;
	noRound: ReadonlyMxrpFnSet<A>;
	round: ReadonlyMxrpFnSet<A>;
	gray: ReadonlyMxrpFnSet<A>;
	black: ReadonlyMxrpFnSet<A>;
	white: ReadonlyMxrpFnSet<A>;
	mode3: ReadonlyMxrpFnSet<A>;
}
function MxrpT<A extends unknown[]>(
	rp0: boolean,
	minDist: boolean,
	round: boolean,
	distanceMode: 0 | 1 | 2 | 3,
	ctor: MxrpConstructor<A>
) {
	return (...a: A) => ctor(rp0, minDist, round, distanceMode, ...a);
}

export function mxrpFunctionSys<A extends unknown[]>(
	ctor: MxrpConstructor<A>
): ReadonlyMxrpFnSet<A> {
	const a: MxrpFnSet<A>[] = [];
	for (let j = 0; j < 32; j++) {
		a[j] = (MxrpT(
			!!(j & 16),
			!!(j & 8),
			!!(j & 4),
			(j & 3) as 0 | 1 | 2 | 3,
			ctor
		) as unknown) as MxrpFnSet<A>;
	}
	for (let j = 0; j < 32; j++) {
		a[j].rp0 = a[j | 16];
		a[j].noRp0 = a[j & ~16];
		a[j].md = a[j | 8];
		a[j].noMD = a[j & ~8];
		a[j].round = a[j | 4];
		a[j].noRound = a[j & ~4];
		a[j].gray = a[(j & ~3) | 0];
		a[j].black = a[(j & ~3) | 1];
		a[j].white = a[(j & ~3) | 2];
		a[j].mode3 = a[(j & ~3) | 3];
	}
	return a[0];
}

// EDSL for IP
export function Ip(rp1: Expr<THandle>, rp2: Expr<THandle>, points: Expr<THandle>[]) {
	return new Stmt(
		new TrIp(
			rp1.tr,
			rp1.type === TwilightPoint,
			rp2.tr,
			rp2.type === TwilightPoint,
			points.map(x => [x.tr, x.type === TwilightPoint])
		)
	);
}

export function Scfs(z: Expr<THandle>, y: number | Expr<Frac>) {
	return new Stmt(new TrScfs(z.tr, z.type.kind === "TwilightPoint", castLiteral(Frac, y).tr));
}
