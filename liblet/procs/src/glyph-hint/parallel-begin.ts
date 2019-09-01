import { HintingPass, IFontSource } from "@chlorophytum/arch";

import { GlyphHintJobs, GlyphHintStore, IHintCacheManager } from "./common";

export async function generateParallelGlyphHintJobs<GID>(
	font: IFontSource<GID>,
	passes: HintingPass[],
	cache: IHintCacheManager,
	forceSerial: boolean
) {
	let ghsMap: Map<string, GlyphHintStore> = new Map();
	let jobs: GlyphHintJobs = {};
	for (const { uniqueID, plugin, parameters } of passes) {
		// Get the hinting model, skip if absent
		if (forceSerial || !plugin.adoptParallel) continue;

		const hm = plugin.adopt(font, parameters);
		if (!hm) continue;

		const glyphs = await hm.analyzeEffectiveGlyphs();
		if (!glyphs) continue;

		const ghs = new GlyphHintStore();

		if (!jobs[uniqueID]) jobs[uniqueID] = [];
		for (const glyph of glyphs) {
			// Skip nameless glyphs
			const gName = await font.getUniqueGlyphName(glyph);
			if (!gName) continue;

			// Skip cached glyphs
			const ckRaw = await hm.getGlyphCacheKey(glyph);
			const ck = ckRaw ? hm.type + "/" + ckRaw : "";
			const cachedHints = ck ? cache.getCache(ck) : null;
			if (ck) ghs.glyphCacheKeys.set(gName, ck);
			if (cachedHints) {
				ghs.glyphHints.set(gName, cachedHints);
			} else {
				jobs[uniqueID].push({ glyphName: gName, cacheKey: ck });
			}
		}

		ghsMap.set(uniqueID, ghs);
	}
	return { jobs, ghsMap };
}
