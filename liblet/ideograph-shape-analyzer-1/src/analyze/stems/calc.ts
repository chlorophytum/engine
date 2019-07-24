import { GlyphPoint } from "@chlorophytum/arch";

import { correctYWForStem } from "../../si-common/hlkey";
import {
	expandZ,
	leftmostZ_S,
	leftmostZ_SS,
	rightmostZ_S,
	rightmostZ_SS,
	slopeOf
} from "../../si-common/seg";
import { HintingStrategy } from "../../strategy";
import Radical from "../../types/radical";
import { SegSpan } from "../../types/seg";
import Stem from "../../types/stem";

export function calculateYW(stem: Stem) {
	correctYWForStem(stem);
}
export function calculateMinMax(stem: Stem, radicals: Radical[], strategy: HintingStrategy) {
	const p = expandZ(
		radicals[stem.belongRadical],
		leftmostZ_SS(stem.high),
		-1,
		-(stem.slope || 0),
		strategy.UPM
	);
	const q = expandZ(
		radicals[stem.belongRadical],
		leftmostZ_SS(stem.low),
		-1,
		-(stem.slope || 0),
		strategy.UPM
	);
	const coP = expandZ(
		radicals[stem.belongRadical],
		rightmostZ_SS(stem.high),
		1,
		stem.slope || 0,
		strategy.UPM
	);
	const coQ = expandZ(
		radicals[stem.belongRadical],
		rightmostZ_SS(stem.low),
		1,
		stem.slope || 0,
		strategy.UPM
	);

	stem.xMinEx = Math.min(p.x, q.x);
	stem.xMaxEx = Math.max(coP.x, coQ.x);
	stem.xMin = Math.min(leftmostZ_SS(stem.high).x, leftmostZ_SS(stem.low).x);
	stem.xMax = Math.max(rightmostZ_SS(stem.high).x, rightmostZ_SS(stem.low).x);
}
function _expandSeg(seg: SegSpan, radical: Radical, slope: number) {
	let z0: GlyphPoint = leftmostZ_S(seg),
		zm: GlyphPoint = rightmostZ_S(seg);
	if (radical) {
		z0 = expandZ(radical, z0, -1, -slope, 1000);
		zm = expandZ(radical, zm, 1, slope, 1000);
	}
	return [z0, zm];
}
export function calculateExp(stem: Stem, radical: Radical) {
	const slopeH = slopeOf(stem.high);
	const slopeL = slopeOf(stem.low);
	stem.highExp = [];
	stem.lowExp = [];
	for (let seg of stem.high) {
		stem.highExp.push(_expandSeg(seg, radical, slopeH));
	}
	for (let seg of stem.low) {
		stem.lowExp.push(_expandSeg(seg, radical, slopeL));
	}
}
