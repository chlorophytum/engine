import { GlyphGeometry } from "@chlorophytum/arch";

import analyzeGlyph from "./analyze";
import { createGlyph } from "./create-glyph";
import HierarchyAnalyzer from "./hierarchy";
import HintGenSink from "./hint-gen";
import HintingStrategy from "./strategy";

export function createHintingStrategy() {
	return new HintingStrategy();
}

export function createHints(geometry: GlyphGeometry, params: HintingStrategy) {
	const glyph = createGlyph(geometry);
	const analysis = analyzeGlyph(glyph, params);
	const sink = new HintGenSink(params.groupName);
	const ha = new HierarchyAnalyzer(analysis, params);

	ha.pre(sink);
	do {
		ha.fetch(sink);
	} while (ha.lastPathWeight && ha.loops < 256);
	ha.post(sink);

	return sink.getHint();
}

export { createSharedHints } from "./shared-hints";
