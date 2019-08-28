import { HintingModelConfig, IFontSource, IHintingModelPlugin } from "@chlorophytum/arch";

import { findMatchingFactory, GlyphHintJobs, GlyphHintStore } from "./common";

export async function generateParallelGlyphHintJobs<GID, VAR, MASTER>(
	font: IFontSource<GID, VAR, MASTER>,
	modelFactories: IHintingModelPlugin[],
	modelConfig: HintingModelConfig[]
) {
	let ghsMap: Map<string, GlyphHintStore> = new Map();
	let jobs: GlyphHintJobs = {};
	for (const { type, parameters } of modelConfig) {
		// Get the hinting model, skip if absent
		const mf = findMatchingFactory(type, modelFactories);
		if (!mf) continue;
		const hm = mf.adopt(font, parameters);
		if (!hm) continue;
		if (!hm.allowParallel) continue;

		const glyphs = await hm.analyzeEffectiveGlyphs();
		if (!glyphs) continue;

		if (!jobs[hm.type]) jobs[hm.type] = [];
		for (const glyph of glyphs) {
			const gName = await font.getUniqueGlyphName(glyph);
			if (gName) jobs[hm.type].push(gName);
		}

		ghsMap.set(hm.type, new GlyphHintStore());
	}
	return { jobs, ghsMap };
}
