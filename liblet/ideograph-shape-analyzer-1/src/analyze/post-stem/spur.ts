import { GlyphAnalysis } from "../analysis";

export default function analyzeSpur(analysis: GlyphAnalysis) {
	for (let s of analysis.stems) {
		let hasLeft = false;
		let hasRight = false;
		for (let z of analysis.blueZone.bottomZs) {
			if (z.x < s.highKey.x && z.y < s.highKey.y && z.x < s.lowKey.x && z.y < s.lowKey.y) {
				hasLeft = true;
			}
			if (z.x > s.highKey.x && z.y < s.highKey.y && z.x > s.lowKey.x && z.y < s.lowKey.y) {
				hasRight = true;
			}
		}
		if (hasLeft && hasRight) {
			s.hasLRSpur = true;
		} else {
			s.hasLRSpur = false;
		}
	}
}
