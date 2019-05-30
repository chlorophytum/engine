export interface MxapConstructor<A extends any[], E> {
	(round: boolean, ...a: A): E;
}
export interface MxapFnSet<A extends any[], E> {
	(...a: A): E;
	noRound: MxapFnSet<A, E>;
	round: MxapFnSet<A, E>;
}
export interface ReadonlyMxapFnSet<A extends any[], E> {
	(...a: A): E;
	readonly noRound: ReadonlyMxapFnSet<A, E>;
	readonly round: ReadonlyMxapFnSet<A, E>;
}
function MxapT<A extends any[], E>(b: boolean, ctor: MxapConstructor<A, E>) {
	return (...a: A) => ctor(b, ...a);
}

export function mxapFunctionSys<A extends any[], E>(
	ctor: MxapConstructor<A, E>
): ReadonlyMxapFnSet<A, E> {
	const noRound = (MxapT(false, ctor) as unknown) as MxapFnSet<A, E>;
	const round = (MxapT(true, ctor) as unknown) as MxapFnSet<A, E>;
	noRound.round = round.round = round;
	round.noRound = noRound.noRound = noRound;
	return noRound;
}

export interface MxrpConstructor<A extends any[], E> {
	(rp0: boolean, minDist: boolean, round: boolean, distanceMode: 0 | 1 | 2 | 3, ...a: A): E;
}
export interface MxrpFnSet<A extends any[], E> {
	(...a: A): E;
	noRp0: MxrpFnSet<A, E>;
	rp0: MxrpFnSet<A, E>;
	noMD: MxrpFnSet<A, E>;
	md: MxrpFnSet<A, E>;
	noRound: MxrpFnSet<A, E>;
	round: MxrpFnSet<A, E>;
	gray: MxrpFnSet<A, E>;
	black: MxrpFnSet<A, E>;
	white: MxrpFnSet<A, E>;
	mode3: MxrpFnSet<A, E>;
}
export interface ReadonlyMxrpFnSet<A extends any[], E> {
	(...a: A): E;
	noRp0: ReadonlyMxrpFnSet<A, E>;
	rp0: ReadonlyMxrpFnSet<A, E>;
	noMD: ReadonlyMxrpFnSet<A, E>;
	md: ReadonlyMxrpFnSet<A, E>;
	noRound: ReadonlyMxrpFnSet<A, E>;
	round: ReadonlyMxrpFnSet<A, E>;
	gray: ReadonlyMxrpFnSet<A, E>;
	black: ReadonlyMxrpFnSet<A, E>;
	white: ReadonlyMxrpFnSet<A, E>;
	mode3: ReadonlyMxrpFnSet<A, E>;
}
function MxrpT<A extends any[], E>(
	rp0: boolean,
	minDist: boolean,
	round: boolean,
	distanceMode: 0 | 1 | 2 | 3,
	ctor: MxrpConstructor<A, E>
) {
	return (...a: A) => ctor(rp0, minDist, round, distanceMode, ...a);
}

export function mxrpFunctionSys<A extends any[], E>(
	ctor: MxrpConstructor<A, E>
): ReadonlyMxrpFnSet<A, E> {
	let a: MxrpFnSet<A, E>[] = [];
	for (let j = 0; j < 32; j++) {
		a[j] = (MxrpT(
			!!(j & 16),
			!!(j & 8),
			!!(j & 4),
			(j & 3) as (0 | 1 | 2 | 3),
			ctor
		) as unknown) as MxrpFnSet<A, E>;
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
