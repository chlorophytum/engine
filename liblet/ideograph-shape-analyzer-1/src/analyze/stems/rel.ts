import { Point } from "@chlorophytum/arch";

import HintingStrategy from "../../strategy";
import Glyph from "../../types/glyph";
import { AdjPoint } from "../../types/point";
import Radical from "../../types/radical";
import Stem, { StemSharedBoolKeys, StemSharedNumberKeys } from "../../types/stem";

import { calculateMinMax } from "./calc";

function pointBelowStem(point: Point, stem: Stem, fuzz: number) {
	return point.y < stem.y - stem.width - fuzz;
}

function PtAbove(
	point: Point,
	stem: Stem,
	xMin: number,
	xMax: number,
	blueFuzz: number,
	sameRadical: boolean
) {
	if (point.y > stem.y && point.x < xMax - blueFuzz && point.x > xMin + blueFuzz) {
		stem.hasGlyphPointAbove = true;
		stem.glyphCenterRise = Math.max(stem.glyphCenterRise || 0, point.y - stem.y);
		if (sameRadical) {
			stem.hasRadicalPointAbove = true;
			stem.radicalCenterRise = Math.max(stem.radicalCenterRise || 0, point.y - stem.y);
		}
	}
}
function PtRightAdjAbove(
	point: Point,
	stem: Stem,
	xMin: number,
	xMax: number,
	blueFuzz: number,
	sameRadical: boolean
) {
	if (point.y > stem.y && point.x >= xMax - blueFuzz && point.x <= xMax + blueFuzz) {
		stem.hasGlyphRightAdjacentPointAbove = true;
		stem.glyphRightAdjacentRise = Math.max(stem.glyphRightAdjacentRise || 0, point.y - stem.y);
		if (sameRadical) {
			stem.hasRadicalRightAdjacentPointAbove = true;
			stem.radicalRightAdjacentRise = Math.max(
				stem.radicalRightAdjacentRise || 0,
				point.y - stem.y
			);
		}
	}
}
function PtLeftAdjAbove(
	point: Point,
	stem: Stem,
	xMin: number,
	xMax: number,
	blueFuzz: number,
	sameRadical: boolean
) {
	if (point.y > stem.y && point.x <= xMin + blueFuzz && point.x >= xMin - blueFuzz) {
		stem.hasGlyphLeftAdjacentPointAbove = true;
		stem.glyphLeftAdjacentRise = Math.max(stem.glyphLeftAdjacentRise || 0, point.y - stem.y);
		if (sameRadical) {
			stem.hasRadicalLeftAdjacentPointAbove = true;
			stem.radicalLeftAdjacentRise = Math.max(
				stem.radicalLeftAdjacentRise || 0,
				point.y - stem.y
			);
		}
	}
}
function PtRightDistAbove(
	point: Point,
	stem: Stem,
	xMin: number,
	xMax: number,
	blueFuzz: number,
	sameRadical: boolean
) {
	if (point.y > stem.y && point.x >= xMax + blueFuzz) {
		stem.hasGlyphRightDistancedPointAbove = true;
		stem.glyphRightDistancedRise = Math.max(
			stem.glyphRightDistancedRise || 0,
			point.y - stem.y
		);
		if (sameRadical) {
			stem.hasRadicalRightDistancedPointAbove = true;
			stem.radicalRightDistancedRise = Math.max(
				stem.radicalRightDistancedRise || 0,
				point.y - stem.y
			);
		}
	}
}
function PtLeftDistAbove(
	point: Point,
	stem: Stem,
	xMin: number,
	xMax: number,
	blueFuzz: number,
	sameRadical: boolean
) {
	if (point.y > stem.y && point.x <= xMin - blueFuzz) {
		stem.hasGlyphLeftDistancedPointAbove = true;
		stem.glyphLeftDistancedRise = Math.max(stem.glyphLeftDistancedRise || 0, point.y - stem.y);
		if (sameRadical) {
			stem.hasRadicalLeftDistancedPointAbove = true;
			stem.radicalLeftDistancedRise = Math.max(
				stem.radicalLeftDistancedRise || 0,
				point.y - stem.y
			);
		}
	}
}
function FoldAbove(
	point: AdjPoint,
	stem: Stem,
	xMin: number,
	xMax: number,
	blueFuzz: number,
	sameRadical: boolean
) {
	if (point.prev && point.prev.prev && point.prev.prev.prev) {
		let z1 = point,
			z2 = point.prev,
			z3 = point.prev.prev,
			z4 = point.prev.prev.prev;
		if (
			z2.x === z3.x &&
			z1.x < z2.x === z4.x < z3.x &&
			((z2.y > stem.y + blueFuzz && z3.y >= stem.y && z2.x < xMax && z2.x > xMin) ||
				(z3.y > stem.y + blueFuzz && z2.y >= stem.y && z3.x < xMax && z3.x > xMin))
		) {
			if (
				(!z2.atLeft && z2.x > xMin + (xMax - xMin) * 0.2) ||
				(z2.atLeft && z2.x < xMax - (xMax - xMin) * 0.2)
			) {
				stem.hasGlyphFoldAbove = true;
				if (sameRadical) {
					stem.hasRadicalFoldAbove = true;
				}
			} else if (z2.x < xMax - (xMax - xMin) * 0.2 && z2.x > xMin + (xMax - xMin) * 0.2) {
				stem.hasGlyphSideFoldAbove = true;
				if (sameRadical) {
					stem.hasRadicalSideFoldAbove = true;
				}
			}
		}
	}
}

function PtBelow(
	point: AdjPoint,
	stem: Stem,
	xMin: number,
	xMax: number,
	blueFuzz: number,
	sameRadical: boolean
) {
	if (
		pointBelowStem(point, stem, blueFuzz) &&
		point.x < xMax - blueFuzz &&
		point.x > xMin + blueFuzz
	) {
		stem.hasGlyphPointBelow = true;
		stem.glyphCenterDescent = Math.max(
			stem.glyphCenterDescent || 0,
			stem.y - stem.width - point.y
		);
		if (sameRadical) {
			stem.hasRadicalPointBelow = true;
			stem.radicalCenterDescent = Math.max(
				stem.radicalCenterDescent || 0,
				stem.y - stem.width - point.y
			);
		}
		if (point.yStrongExtrema) {
			stem.hasGlyphVFoldBelow = true;
			if (sameRadical) {
				stem.hasRadicalVFoldBelow = true;
			}
		}
	}
}
function PtRightAdjBelow(
	point: Point,
	stem: Stem,
	xMin: number,
	xMax: number,
	blueFuzz: number,
	sameRadical: boolean
) {
	if (
		pointBelowStem(point, stem, blueFuzz) &&
		point.x >= xMax - blueFuzz &&
		point.x <= xMax + blueFuzz
	) {
		stem.hasGlyphRightAdjacentPointBelow = true;
		stem.glyphRightAdjacentDescent = Math.max(
			stem.glyphRightAdjacentDescent || 0,
			stem.y - stem.width - point.y
		);
		if (sameRadical) {
			stem.hasRadicalRightAdjacentPointBelow = true;
			stem.radicalRightAdjacentDescent = Math.max(
				stem.radicalRightAdjacentDescent || 0,
				stem.y - stem.width - point.y
			);
		}
	}
}
function PtLeftAdjBelow(
	point: Point,
	stem: Stem,
	xMin: number,
	xMax: number,
	blueFuzz: number,
	sameRadical: boolean
) {
	if (
		pointBelowStem(point, stem, blueFuzz) &&
		point.x <= xMin + blueFuzz &&
		point.x >= xMin - blueFuzz
	) {
		stem.hasGlyphLeftAdjacentPointBelow = true;
		stem.glyphLeftAdjacentDescent = Math.max(
			stem.glyphLeftAdjacentDescent || 0,
			stem.y - stem.width - point.y
		);
		if (sameRadical) {
			stem.hasRadicalLeftAdjacentPointBelow = true;
			stem.radicalLeftAdjacentDescent = Math.max(
				stem.radicalLeftAdjacentDescent || 0,
				stem.y - stem.width - point.y
			);
		}
	}
}
function PtRightDistBelow(
	point: Point,
	stem: Stem,
	xMin: number,
	xMax: number,
	blueFuzz: number,
	sameRadical: boolean
) {
	if (pointBelowStem(point, stem, blueFuzz) && point.x >= xMax + blueFuzz) {
		stem.hasGlyphRightDistancedPointBelow = true;
		stem.glyphRightDistancedDescent = Math.max(
			stem.glyphRightDistancedDescent || 0,
			stem.y - stem.width - point.y
		);
		if (sameRadical) {
			stem.hasRadicalRightDistancedPointBelow = true;
			stem.radicalRightDistancedDescent = Math.max(
				stem.radicalRightDistancedDescent || 0,
				stem.y - stem.width - point.y
			);
		}
	}
}
function PtLeftDistBelow(
	point: Point,
	stem: Stem,
	xMin: number,
	xMax: number,
	blueFuzz: number,
	sameRadical: boolean
) {
	if (pointBelowStem(point, stem, blueFuzz) && point.x <= xMin - blueFuzz) {
		stem.hasGlyphLeftDistancedPointBelow = true;
		stem.glyphLeftDistancedDescent = Math.max(
			stem.glyphLeftDistancedDescent || 0,
			stem.y - stem.width - point.y
		);
		if (sameRadical) {
			stem.hasRadicalLeftDistancedPointBelow = true;
			stem.radicalLeftDistancedDescent = Math.max(
				stem.radicalLeftDistancedDescent || 0,
				stem.y - stem.width - point.y
			);
		}
	}
}
function FoldBelow(
	point: AdjPoint,
	stem: Stem,
	xMin: number,
	xMax: number,
	blueFuzz: number,
	sameRadical: boolean
) {
	if (
		pointBelowStem(point, stem, blueFuzz) &&
		point.xStrongExtrema &&
		!(point.yExtrema && !point.yStrongExtrema) &&
		point.x < xMax + Math.min((xMax - xMin) / 3, stem.width) &&
		point.x > xMin - Math.min((xMax - xMin) / 3, stem.width)
	) {
		if (
			(!point.atLeft && point.x > xMin + (xMax - xMin) * 0.2) ||
			(point.atLeft && point.x < xMax - (xMax - xMin) * 0.2)
		) {
			stem.hasGlyphFoldBelow = true;
			if (sameRadical) {
				stem.hasRadicalFoldBelow = true;
			}
		} else if (point.x < xMax - (xMax - xMin) * 0.2 && point.x > xMin + (xMax - xMin) * 0.2) {
			stem.hasGlyphSideFoldBelow = true;
			if (sameRadical) {
				stem.hasRadicalSideFoldBelow = true;
			}
		}
	}
}

function analyzeRadicalPointsToStemRelationships(
	radical: Radical,
	stem: Stem,
	sameRadical: boolean,
	strategy: HintingStrategy
) {
	stem.proximityUp = 0;
	stem.proximityDown = 0;
	const blueFuzz = strategy.BLUE_ZONE_WIDTH || 15;
	const a0 = stem.low[0][0].x,
		az = stem.low[stem.low.length - 1][stem.low[stem.low.length - 1].length - 1].x;
	const b0 = stem.high[0][0].x,
		bz = stem.high[stem.high.length - 1][stem.high[stem.high.length - 1].length - 1].x;
	const xMin = Math.min(a0, b0, az, bz),
		xMax = Math.max(a0, b0, az, bz);
	const radicalParts = [radical.outline].concat(radical.holes);
	for (let j = 0; j < radicalParts.length; j++) {
		for (let k = 0; k < radicalParts[j].points.length - 1; k++) {
			const point = radicalParts[j].points[k];
			PtAbove(point, stem, xMin, xMax, blueFuzz, sameRadical);
			PtRightAdjAbove(point, stem, xMin, xMax, blueFuzz, sameRadical);
			PtLeftAdjAbove(point, stem, xMin, xMax, blueFuzz, sameRadical);
			PtRightDistAbove(point, stem, xMin, xMax, blueFuzz, sameRadical);
			PtLeftDistAbove(point, stem, xMin, xMax, blueFuzz, sameRadical);
			FoldAbove(point, stem, xMin, xMax, blueFuzz, sameRadical);
			PtBelow(point, stem, xMin, xMax, blueFuzz, sameRadical);
			PtRightAdjBelow(point, stem, xMin, xMax, blueFuzz, sameRadical);
			PtLeftAdjBelow(point, stem, xMin, xMax, blueFuzz, sameRadical);
			PtRightDistBelow(point, stem, xMin, xMax, blueFuzz, sameRadical);
			PtLeftDistBelow(point, stem, xMin, xMax, blueFuzz, sameRadical);
			FoldBelow(point, stem, xMin, xMax, blueFuzz, sameRadical);
		}
	}
}

function analyzePointToStemSpatialRelationships(
	stem: Stem,
	radicals: Radical[],
	strategy: HintingStrategy
) {
	for (let rad = 0; rad < radicals.length; rad++) {
		let radical = radicals[rad];
		let sameRadical = radical === radicals[stem.belongRadical];
		analyzeRadicalPointsToStemRelationships(radical, stem, sameRadical, strategy);
	}
	calculateMinMax(stem, radicals, strategy);
}

export function analyzeStemSpatialRelationships(
	stems: Stem[],
	radicals: Radical[],
	overlaps: number[][],
	strategy: HintingStrategy
) {
	for (let k = 0; k < stems.length; k++) {
		analyzePointToStemSpatialRelationships(stems[k], radicals, strategy);
		for (let j = 0; j < stems.length; j++) {
			if (
				overlaps[j][k] > strategy.COLLISION_MIN_OVERLAP_RATIO &&
				stems[j].y > stems[k].y &&
				!(stems[j].rid && stems[j].rid === stems[k].rid)
			) {
				stems[k].hasGlyphStemAbove = true;
				stems[j].hasGlyphStemBelow = true;
				if (stems[j].belongRadical === stems[k].belongRadical) {
					stems[j].hasSameRadicalStemBelow = true;
					stems[k].hasSameRadicalStemAbove = true;
				}
			}
		}
	}
	// share stat data between two halfs of diagonal stems
	for (let j = 0; j < stems.length; j++) {
		for (let k = 0; k < j; k++) {
			const sj = stems[j],
				sk = stems[k];
			if (!(sj.rid && sj.rid === sk.rid)) continue;
			for (let p of StemSharedBoolKeys) sj[p] = sk[p] = !!sj[p] || !!sk[p];
			for (let p of StemSharedNumberKeys) sj[p] = sk[p] = Math.max(sj[p] || 0, sk[p] || 0);
		}
	}
}

function analyzePBS(u: Stem, v: Stem, radical: Radical, strategy: HintingStrategy) {
	let blueFuzz = strategy.BLUE_ZONE_WIDTH || 15;
	let radicalParts = [radical.outline].concat(radical.holes);
	let ans = 0;
	for (let j = 0; j < radicalParts.length; j++) {
		for (let k = 0; k < radicalParts[j].points.length - 1; k++) {
			let point = radicalParts[j].points[k];
			if (
				(!u.hasGlyphPointAbove ||
					!v.hasGlyphPointBelow ||
					point.xExtrema ||
					point.yExtrema) &&
				point.y > v.y + blueFuzz &&
				point.y < u.y - u.width - blueFuzz &&
				point.x > v.xMin + blueFuzz &&
				point.x < v.xMax - blueFuzz &&
				point.x > u.xMin + blueFuzz &&
				point.x < u.xMax - blueFuzz
			) {
				if (ans < 1) ans = 1;
				if (point.xStrongExtrema && ans < 2) {
					ans = 2;
				}
			}
		}
	}
	return ans;
}

export function analyzePointBetweenStems(
	stems: Stem[],
	radicals: Radical[],
	strategy: HintingStrategy
) {
	let res: number[][] = [];
	for (let sj = 0; sj < stems.length; sj++) {
		res[sj] = [];
		for (let sk = 0; sk < sj; sk++) {
			res[sj][sk] = 0;
			for (let rad = 0; rad < radicals.length; rad++) {
				res[sj][sk] += analyzePBS(stems[sj], stems[sk], radicals[rad], strategy);
			}
		}
	}
	return res;
}

export function analyzeEntireContourBetweenStems(glyph: Glyph, stems: Stem[]) {
	let ans: number[][] = [];
	for (let j = 0; j < stems.length; j++) {
		ans[j] = [];
		for (let k = 0; k < stems.length; k++) {
			ans[j][k] = 0;
			if (!(stems[j].y > stems[k].y)) continue;
			for (let c = 0; c < glyph.contours.length; c++) {
				let cr = glyph.contours[c];
				let sj = stems[j];
				let sk = stems[k];
				if (
					cr.stats.xMin >= sj.xMin &&
					cr.stats.xMax <= sj.xMax &&
					cr.stats.xMin >= sk.xMin &&
					cr.stats.xMax <= sk.xMax &&
					cr.stats.yMax <= sj.y &&
					cr.stats.yMin >= sk.y
				) {
					ans[j][k] += 1;
				}
			}
		}
	}
	return ans;
}

export function analyzeEntireContourAboveBelow(glyph: Glyph, stems: Stem[]) {
	for (let j = 0; j < stems.length; j++) {
		let sj = stems[j];
		for (let c = 0; c < glyph.contours.length; c++) {
			let cr = glyph.contours[c];
			if (cr.stats.xMin >= sj.xMin && cr.stats.xMax <= sj.xMax && cr.stats.yMin >= sj.y) {
				sj.hasEntireContourAbove = true;
			}
			if (
				cr.stats.xMin >= sj.xMin &&
				cr.stats.xMax <= sj.xMax &&
				cr.stats.yMax <= sj.y - sj.width
			) {
				sj.hasEntireContourBelow = true;
			}
		}
	}
}
