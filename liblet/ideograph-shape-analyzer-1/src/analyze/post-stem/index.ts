import { HintingStrategy } from "../../strategy";
import Glyph from "../../types/glyph";
import { GlyphAnalysis } from "../analysis";

import analyzeBlueZonePoints from "./bluezone-points";
import AnalyzeIpSa from "./ipsa";
import analyzeSymmetry from "./symmetry";

export default function analyzePostStemHints(
	glyph: Glyph,
	strategy: HintingStrategy,
	analysis: GlyphAnalysis
) {
	analysis.blueZone = analyzeBlueZonePoints(glyph, analysis, strategy);
	const iss = AnalyzeIpSa(glyph, analysis, strategy);
	analysis.interpolations = iss.interpolations;
	analysis.shortAbsorptions = iss.shortAbsorptions;
	analysis.symmetry = analyzeSymmetry(analysis.stems, analysis.directOverlaps, strategy);
}
