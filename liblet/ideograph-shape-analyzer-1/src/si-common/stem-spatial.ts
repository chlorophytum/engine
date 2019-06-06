import HintingStrategy from "../strategy";
import Stem from "../types/stem";

export function atRadicalBottom(s: Stem, strategy: HintingStrategy) {
	return (
		!s.hasSameRadicalStemBelow &&
		!(s.hasRadicalPointBelow && s.radicalCenterDescent > strategy.STEM_CENTER_MIN_DESCENT) &&
		!(
			s.hasRadicalLeftAdjacentPointBelow &&
			s.radicalLeftAdjacentDescent > strategy.STEM_SIDE_MIN_DESCENT
		) &&
		!(
			s.hasRadicalRightAdjacentPointBelow &&
			s.radicalRightAdjacentDescent > strategy.STEM_SIDE_MIN_DESCENT
		)
	);
}

export function atGlyphBottom(stem: Stem, strategy: HintingStrategy) {
	return (
		atRadicalBottom(stem, strategy) &&
		!stem.hasGlyphStemBelow &&
		!(stem.hasGlyphPointBelow && stem.glyphCenterDescent > strategy.STEM_CENTER_MIN_DESCENT) &&
		!(
			stem.hasGlyphLeftAdjacentPointBelow &&
			stem.glyphLeftAdjacentDescent > strategy.STEM_SIDE_MIN_DESCENT
		) &&
		!(
			stem.hasGlyphRightAdjacentPointBelow &&
			stem.glyphRightAdjacentDescent > strategy.STEM_SIDE_MIN_DESCENT
		)
	);
}

export function atRadicalBottomMost(stem: Stem, strategy: HintingStrategy) {
	return (
		atRadicalBottom(stem, strategy) &&
		!(
			stem.hasRadicalLeftDistancedPointBelow &&
			stem.radicalLeftDistancedDescent > strategy.STEM_SIDE_MIN_DIST_DESCENT
		) &&
		!(
			stem.hasRadicalRightDistancedPointBelow &&
			stem.radicalRightDistancedDescent > strategy.STEM_SIDE_MIN_DIST_DESCENT
		)
	);
}
export function isCapShape(stem: Stem, strategy: HintingStrategy) {
	return (
		atRadicalBottom(stem, strategy) &&
		((stem.hasRadicalLeftDistancedPointBelow &&
			stem.radicalLeftDistancedDescent > strategy.STEM_SIDE_MIN_DIST_DESCENT) ||
			(stem.hasRadicalRightDistancedPointBelow &&
				stem.radicalRightDistancedDescent > strategy.STEM_SIDE_MIN_DIST_DESCENT))
	);
}
export function atGlyphBottomMost(stem: Stem, strategy: HintingStrategy) {
	return (
		atGlyphBottom(stem, strategy) &&
		!(
			stem.hasGlyphLeftDistancedPointBelow &&
			stem.glyphLeftDistancedDescent > strategy.STEM_SIDE_MIN_DIST_DESCENT
		) &&
		!(
			stem.hasGlyphRightDistancedPointBelow &&
			stem.glyphRightDistancedDescent > strategy.STEM_SIDE_MIN_DIST_DESCENT
		) &&
		!(
			stem.hasRadicalLeftAdjacentPointBelow &&
			stem.radicalLeftAdjacentDescent > strategy.STEM_SIDE_MIN_DESCENT / 3
		) &&
		!(
			stem.hasRadicalRightAdjacentPointBelow &&
			stem.radicalRightAdjacentDescent > strategy.STEM_SIDE_MIN_DESCENT / 3
		)
	);
}

export function atStrictRadicalBottom(stem: Stem, strategy: HintingStrategy) {
	return (
		atRadicalBottom(stem, strategy) &&
		!stem.hasRadicalLeftAdjacentPointBelow &&
		!stem.hasRadicalRightAdjacentPointBelow &&
		!stem.hasRadicalLeftDistancedPointBelow &&
		!stem.hasRadicalRightDistancedPointBelow
	);
}

export function atRadicalTop(stem: Stem, strategy: HintingStrategy) {
	return (
		!stem.hasSameRadicalStemAbove &&
		!(stem.hasRadicalPointAbove && stem.radicalCenterRise > strategy.STEM_CENTER_MIN_RISE) &&
		!(
			stem.hasRadicalLeftAdjacentPointAbove &&
			stem.radicalLeftAdjacentRise > strategy.STEM_SIDE_MIN_RISE
		) &&
		!(
			stem.hasRadicalRightAdjacentPointAbove &&
			stem.radicalRightAdjacentRise > strategy.STEM_SIDE_MIN_RISE
		) &&
		!(
			stem.hasRadicalLeftDistancedPointAbove &&
			stem.radicalLeftDistancedRise > strategy.STEM_SIDE_MIN_DIST_RISE
		) &&
		!(
			stem.hasRadicalRightDistancedPointAbove &&
			stem.radicalRightDistancedRise > strategy.STEM_SIDE_MIN_DIST_RISE
		)
	);
}

export function atGlyphTop(stem: Stem, strategy: HintingStrategy) {
	return (
		atRadicalTop(stem, strategy) &&
		!stem.hasGlyphStemAbove &&
		!(stem.hasGlyphPointAbove && stem.glyphCenterRise > strategy.STEM_CENTER_MIN_RISE) &&
		!(
			stem.hasGlyphLeftAdjacentPointAbove &&
			stem.glyphLeftAdjacentRise > strategy.STEM_SIDE_MIN_RISE
		) &&
		!(
			stem.hasGlyphRightAdjacentPointAbove &&
			stem.glyphRightAdjacentRise > strategy.STEM_SIDE_MIN_RISE
		)
	);
}
