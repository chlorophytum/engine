import { AdjPoint, CPoint } from "./point";
import { PostHint } from "./post-hint";
import { Seg } from "./seg";

export default class Stem {
	public highExp: Seg;
	public lowExp: Seg;
	public y: number;
	public width: number;
	public slope: number;
	public belongRadical: number;
	public xMin: number = 0xffff;
	public xMax: number = -0xffff;
	public xMinEx: number = 0xffff;
	public xMaxEx: number = -0xffff;

	public highKey: AdjPoint = new CPoint(0, 0);
	public lowKey: AdjPoint = new CPoint(0, 0);
	public highAlign: AdjPoint[] = [];
	public lowAlign: AdjPoint[] = [];

	public rid?: number;
	public diagHigh?: boolean;
	public diagLow?: boolean;
	public atLeft?: boolean;
	public atRight?: boolean;
	public ipHigh?: PostHint[];
	public ipLow?: PostHint[];

	public turnsBelow = 0;
	public turnsAbove = 0;
	public proximityUp = 0;
	public proximityDown = 0;

	public hasGlyphStemAbove = false;
	public hasSameRadicalStemAbove = false;
	public hasRadicalPointAbove = false;
	public hasGlyphPointAbove = false;
	public hasRadicalLeftAdjacentPointAbove = false;
	public hasRadicalRightAdjacentPointAbove = false;
	public hasGlyphLeftAdjacentPointAbove = false;
	public hasGlyphRightAdjacentPointAbove = false;
	public hasRadicalLeftDistancedPointAbove = false;
	public hasRadicalRightDistancedPointAbove = false;
	public hasGlyphLeftDistancedPointAbove = false;
	public hasGlyphRightDistancedPointAbove = false;
	public hasGlyphStemBelow = false;
	public hasSameRadicalStemBelow = false;
	public hasRadicalPointBelow = false;
	public hasGlyphPointBelow = false;
	public hasRadicalLeftAdjacentPointBelow = false;
	public hasRadicalRightAdjacentPointBelow = false;
	public hasGlyphLeftAdjacentPointBelow = false;
	public hasGlyphRightAdjacentPointBelow = false;
	public hasRadicalLeftDistancedPointBelow = false;
	public hasRadicalRightDistancedPointBelow = false;
	public hasGlyphLeftDistancedPointBelow = false;
	public hasGlyphRightDistancedPointBelow = false;
	public hasGlyphFoldAbove = false;
	public hasRadicalFoldAbove = false;
	public hasGlyphSideFoldAbove = false;
	public hasRadicalSideFoldAbove = false;
	public hasGlyphFoldBelow = false;
	public hasRadicalFoldBelow = false;
	public hasGlyphSideFoldBelow = false;
	public hasRadicalSideFoldBelow = false;
	public hasGlyphVFoldBelow = false;
	public hasRadicalVFoldBelow = false;
	public hasEntireContourAbove = false;
	public hasEntireContourBelow = false;

	public radicalCenterRise = 0;
	public glyphCenterRise = 0;
	public radicalRightAdjacentRise = 0;
	public radicalLeftAdjacentRise = 0;
	public glyphRightAdjacentRise = 0;
	public glyphLeftAdjacentRise = 0;
	public radicalRightDistancedRise = 0;
	public radicalLeftDistancedRise = 0;
	public glyphRightDistancedRise = 0;
	public glyphLeftDistancedRise = 0;
	public radicalCenterDescent = 0;
	public glyphCenterDescent = 0;
	public radicalLeftAdjacentDescent = 0;
	public radicalRightAdjacentDescent = 0;
	public glyphLeftAdjacentDescent = 0;
	public glyphRightAdjacentDescent = 0;
	public radicalLeftDistancedDescent = 0;
	public radicalRightDistancedDescent = 0;
	public glyphLeftDistancedDescent = 0;
	public glyphRightDistancedDescent = 0;

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
