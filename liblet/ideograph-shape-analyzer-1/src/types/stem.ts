import { AdjPoint, CPoint } from "./point";
import { PostHint } from "./post-hint";
import { Seg } from "./seg";

export default class Stem {
	highExp: Seg;
	lowExp: Seg;
	y: number;
	width: number;
	slope: number;
	belongRadical: number;
	xMin: number = 0xffff;
	xMax: number = -0xffff;
	xMinEx: number = 0xffff;
	xMaxEx: number = -0xffff;

	highKey: AdjPoint = new CPoint(0, 0);
	lowKey: AdjPoint = new CPoint(0, 0);
	highAlign: AdjPoint[] = [];
	lowAlign: AdjPoint[] = [];

	rid?: number;
	diagHigh?: boolean;
	diagLow?: boolean;
	atLeft?: boolean;
	atRight?: boolean;
	ipHigh?: PostHint[];
	ipLow?: PostHint[];

	turnsBelow = 0;
	turnsAbove = 0;
	proximityUp = 0;
	proximityDown = 0;

	hasGlyphStemAbove = false;
	hasSameRadicalStemAbove = false;
	hasRadicalPointAbove = false;
	hasGlyphPointAbove = false;
	hasRadicalLeftAdjacentPointAbove = false;
	hasRadicalRightAdjacentPointAbove = false;
	hasGlyphLeftAdjacentPointAbove = false;
	hasGlyphRightAdjacentPointAbove = false;
	hasRadicalLeftDistancedPointAbove = false;
	hasRadicalRightDistancedPointAbove = false;
	hasGlyphLeftDistancedPointAbove = false;
	hasGlyphRightDistancedPointAbove = false;
	hasGlyphStemBelow = false;
	hasSameRadicalStemBelow = false;
	hasRadicalPointBelow = false;
	hasGlyphPointBelow = false;
	hasRadicalLeftAdjacentPointBelow = false;
	hasRadicalRightAdjacentPointBelow = false;
	hasGlyphLeftAdjacentPointBelow = false;
	hasGlyphRightAdjacentPointBelow = false;
	hasRadicalLeftDistancedPointBelow = false;
	hasRadicalRightDistancedPointBelow = false;
	hasGlyphLeftDistancedPointBelow = false;
	hasGlyphRightDistancedPointBelow = false;
	hasGlyphFoldAbove = false;
	hasRadicalFoldAbove = false;
	hasGlyphSideFoldAbove = false;
	hasRadicalSideFoldAbove = false;
	hasGlyphFoldBelow = false;
	hasRadicalFoldBelow = false;
	hasGlyphSideFoldBelow = false;
	hasRadicalSideFoldBelow = false;
	hasGlyphVFoldBelow = false;
	hasRadicalVFoldBelow = false;
	hasEntireContourAbove = false;
	hasEntireContourBelow = false;

	radicalCenterRise = 0;
	glyphCenterRise = 0;
	radicalRightAdjacentRise = 0;
	radicalLeftAdjacentRise = 0;
	glyphRightAdjacentRise = 0;
	glyphLeftAdjacentRise = 0;
	radicalRightDistancedRise = 0;
	radicalLeftDistancedRise = 0;
	glyphRightDistancedRise = 0;
	glyphLeftDistancedRise = 0;
	radicalCenterDescent = 0;
	glyphCenterDescent = 0;
	radicalLeftAdjacentDescent = 0;
	radicalRightAdjacentDescent = 0;
	glyphLeftAdjacentDescent = 0;
	glyphRightAdjacentDescent = 0;
	radicalLeftDistancedDescent = 0;
	radicalRightDistancedDescent = 0;
	glyphLeftDistancedDescent = 0;
	glyphRightDistancedDescent = 0;

	constructor(public high: Seg, public low: Seg, r: number) {
		this.high = high;
		this.low = low;
		this.highExp = high;
		this.lowExp = low;
		this.y = high[0][0].y;
		this.width = Math.abs(high[0][0].y - low[0][0].y);
		this.slope = 0;
		this.belongRadical = r;
	}
}

export type StemSharedBoolKey =
	| "hasGlyphStemAbove"
	| "hasSameRadicalStemAbove"
	| "hasRadicalPointAbove"
	| "hasGlyphPointAbove"
	| "hasRadicalLeftAdjacentPointAbove"
	| "hasRadicalRightAdjacentPointAbove"
	| "hasGlyphLeftAdjacentPointAbove"
	| "hasGlyphRightAdjacentPointAbove"
	| "hasRadicalLeftDistancedPointAbove"
	| "hasRadicalRightDistancedPointAbove"
	| "hasGlyphLeftDistancedPointAbove"
	| "hasGlyphRightDistancedPointAbove"
	| "hasGlyphStemBelow"
	| "hasSameRadicalStemBelow"
	| "hasRadicalPointBelow"
	| "hasGlyphPointBelow"
	| "hasRadicalLeftAdjacentPointBelow"
	| "hasRadicalRightAdjacentPointBelow"
	| "hasGlyphLeftAdjacentPointBelow"
	| "hasGlyphRightAdjacentPointBelow"
	| "hasRadicalLeftDistancedPointBelow"
	| "hasRadicalRightDistancedPointBelow"
	| "hasGlyphLeftDistancedPointBelow"
	| "hasGlyphRightDistancedPointBelow"
	| "hasGlyphFoldAbove"
	| "hasRadicalFoldAbove"
	| "hasGlyphSideFoldAbove"
	| "hasRadicalSideFoldAbove"
	| "hasGlyphFoldBelow"
	| "hasRadicalFoldBelow"
	| "hasGlyphSideFoldBelow"
	| "hasRadicalSideFoldBelow"
	| "hasGlyphVFoldBelow"
	| "hasRadicalVFoldBelow"
	| "hasEntireContourAbove"
	| "hasEntireContourBelow";
export type StemSharedNumberKey =
	| "radicalCenterRise"
	| "glyphCenterRise"
	| "radicalRightAdjacentRise"
	| "radicalLeftAdjacentRise"
	| "glyphRightAdjacentRise"
	| "glyphLeftAdjacentRise"
	| "radicalRightDistancedRise"
	| "radicalLeftDistancedRise"
	| "glyphRightDistancedRise"
	| "glyphLeftDistancedRise"
	| "radicalCenterDescent"
	| "glyphCenterDescent"
	| "radicalLeftAdjacentDescent"
	| "radicalRightAdjacentDescent"
	| "glyphLeftAdjacentDescent"
	| "glyphRightAdjacentDescent"
	| "radicalLeftDistancedDescent"
	| "radicalRightDistancedDescent"
	| "glyphLeftDistancedDescent"
	| "glyphRightDistancedDescent";
export const StemSharedBoolKeys: StemSharedBoolKey[] = [
	"hasGlyphStemAbove",
	"hasSameRadicalStemAbove",
	"hasRadicalPointAbove",
	"hasGlyphPointAbove",
	"hasRadicalLeftAdjacentPointAbove",
	"hasRadicalRightAdjacentPointAbove",
	"hasGlyphLeftAdjacentPointAbove",
	"hasGlyphRightAdjacentPointAbove",
	"hasRadicalLeftDistancedPointAbove",
	"hasRadicalRightDistancedPointAbove",
	"hasGlyphLeftDistancedPointAbove",
	"hasGlyphRightDistancedPointAbove",
	"hasGlyphStemBelow",
	"hasSameRadicalStemBelow",
	"hasRadicalPointBelow",
	"hasGlyphPointBelow",
	"hasRadicalLeftAdjacentPointBelow",
	"hasRadicalRightAdjacentPointBelow",
	"hasGlyphLeftAdjacentPointBelow",
	"hasGlyphRightAdjacentPointBelow",
	"hasRadicalLeftDistancedPointBelow",
	"hasRadicalRightDistancedPointBelow",
	"hasGlyphLeftDistancedPointBelow",
	"hasGlyphRightDistancedPointBelow",
	"hasGlyphFoldAbove",
	"hasRadicalFoldAbove",
	"hasGlyphSideFoldAbove",
	"hasRadicalSideFoldAbove",
	"hasGlyphFoldBelow",
	"hasRadicalFoldBelow",
	"hasGlyphSideFoldBelow",
	"hasRadicalSideFoldBelow",
	"hasGlyphVFoldBelow",
	"hasRadicalVFoldBelow",
	"hasEntireContourAbove",
	"hasEntireContourBelow"
];
export const StemSharedNumberKeys: StemSharedNumberKey[] = [
	"radicalCenterRise",
	"glyphCenterRise",
	"radicalRightAdjacentRise",
	"radicalLeftAdjacentRise",
	"glyphRightAdjacentRise",
	"glyphLeftAdjacentRise",
	"radicalRightDistancedRise",
	"radicalLeftDistancedRise",
	"glyphRightDistancedRise",
	"glyphLeftDistancedRise",
	"radicalCenterDescent",
	"glyphCenterDescent",
	"radicalLeftAdjacentDescent",
	"radicalRightAdjacentDescent",
	"glyphLeftAdjacentDescent",
	"glyphRightAdjacentDescent",
	"radicalLeftDistancedDescent",
	"radicalRightDistancedDescent",
	"glyphLeftDistancedDescent",
	"glyphRightDistancedDescent"
];
