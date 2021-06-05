export type UnicodeSubRange =
	| string
	| number
	| [number, number]
	| UnicodeSubRangeUnion
	| UnicodeSubRangeIntersection
	| UnicodeSubRangeDifference;
type UnicodeSubRangeUnion = { readonly union: ReadonlyArray<UnicodeSubRange> };
type UnicodeSubRangeIntersection = { readonly intersection: ReadonlyArray<UnicodeSubRange> };
type UnicodeSubRangeDifference = { readonly difference: ReadonlyArray<UnicodeSubRange> };

function isUnion(sr: UnicodeSubRange): sr is UnicodeSubRangeUnion {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return !!(sr as any).union;
}
function isIntersection(sr: UnicodeSubRange): sr is UnicodeSubRangeIntersection {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return !!(sr as any).intersection;
}
function isDifference(sr: UnicodeSubRange): sr is UnicodeSubRangeDifference {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return !!(sr as any).difference;
}

export function evaluateUnicodeSubRange(usr: UnicodeSubRange): Set<number> {
	if (typeof usr === "string") return loadPredefinedUsr(usr);
	if (typeof usr === "number") return new Set([usr]);
	if (Array.isArray(usr)) return rangeUsr(usr);
	if (isUnion(usr)) return unionUsr(usr);
	if (isIntersection(usr)) return intersectUsr(usr);
	if (isDifference(usr)) return differenceUsr(usr);
	throw new Error("Unreachable");
}
function loadPredefinedUsr(ur: string) {
	if (
		ur.startsWith("Block/") ||
		ur.startsWith("Script/") ||
		ur.startsWith("Script_Extensions/")
	) {
		const sink = new Set<number>();
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const cps: number[] = require(`@unicode/unicode-13.0.0/${ur}/code-points.js`);
		for (const ch of cps) sink.add(ch);
		return sink;
	} else {
		throw new Error(`Cannot resolve ${ur} to a Unicode subset`);
	}
}
function rangeUsr(ur: [number, number]) {
	const sink = new Set<number>();
	const [s, e] = ur;
	for (let ch = s; ch <= e; ch++) sink.add(ch);
	return sink;
}
function unionUsr(usr: UnicodeSubRangeUnion): Set<number> {
	const sink = evaluateUnicodeSubRange(usr.union[0]);
	for (let i = 1; i < usr.union.length; i++) {
		for (const ch of evaluateUnicodeSubRange(usr.union[i])) sink.add(ch);
	}
	return sink;
}
function intersectUsr(usr: UnicodeSubRangeIntersection): Set<number> {
	const sink = evaluateUnicodeSubRange(usr.intersection[0]);
	for (let i = 1; i < usr.intersection.length; i++) {
		const s = evaluateUnicodeSubRange(usr.intersection[i]);
		for (const ch of sink) if (!s.has(ch)) sink.delete(ch);
	}
	return sink;
}
function differenceUsr(usr: UnicodeSubRangeDifference): Set<number> {
	const sink = evaluateUnicodeSubRange(usr.difference[0]);
	for (let i = 1; i < usr.difference.length; i++) {
		const s = evaluateUnicodeSubRange(usr.difference[i]);
		for (const ch of sink) if (s.has(ch)) sink.delete(ch);
	}
	return sink;
}
