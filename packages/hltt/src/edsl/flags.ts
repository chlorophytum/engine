import { Statement } from "../ast";

export interface MxapConstructor<A extends any[]> {
	(round: boolean, ...a: A): Statement;
}
export interface MxapFnSet<A extends any[]> {
	(...a: A): Statement;
	noRound: MxapFnSet<A>;
	round: MxapFnSet<A>;
}
export interface ReadonlyMxapFnSet<A extends any[]> {
	(...a: A): Statement;
	readonly noRound: ReadonlyMxapFnSet<A>;
	readonly round: ReadonlyMxapFnSet<A>;
}
function MxapT<A extends any[], E>(b: boolean, ctor: MxapConstructor<A>) {
	return (...a: A) => ctor(b, ...a);
}

export function mxapFunctionSys<A extends any[], E>(
	ctor: MxapConstructor<A>
): ReadonlyMxapFnSet<A> {
	const noRound = (MxapT(false, ctor) as unknown) as MxapFnSet<A>;
	const round = (MxapT(true, ctor) as unknown) as MxapFnSet<A>;
	noRound.round = round.round = round;
	round.noRound = noRound.noRound = noRound;
	return noRound;
}

export interface MxrpConstructor<A extends any[]> {
	(
		rp0: boolean,
		minDist: boolean,
		round: boolean,
		distanceMode: 0 | 1 | 2 | 3,
		...a: A
	): Statement;
}
export interface MxrpFnSet<A extends any[]> {
	(...a: A): Statement;
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
export interface ReadonlyMxrpFnSet<A extends any[]> {
	(...a: A): Statement;
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
function MxrpT<A extends any[]>(
	rp0: boolean,
	minDist: boolean,
	round: boolean,
	distanceMode: 0 | 1 | 2 | 3,
	ctor: MxrpConstructor<A>
) {
	return (...a: A) => ctor(rp0, minDist, round, distanceMode, ...a);
}

export function mxrpFunctionSys<A extends any[]>(ctor: MxrpConstructor<A>): ReadonlyMxrpFnSet<A> {
	let a: MxrpFnSet<A>[] = [];
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
