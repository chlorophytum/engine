import { Glyph } from "@chlorophytum/arch";

import analyzeGlyph from "../analyze";
import HierarchyAnalyzer from "../hierarchy";
import HintGenSink from "../hint-gen/glyph-hints";
import { HintingStrategy } from "../strategy";

import { createGlyph } from "./create-glyph";

export function hintGlyphGeometry(geometry: Glyph.Shape, params: HintingStrategy) {
	const glyph = createGlyph(geometry.eigen); // Care about outline glyphs only
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
