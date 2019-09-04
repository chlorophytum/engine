import { HintingPass, IFontSource, ILogger } from "@chlorophytum/arch";

import { Progress } from "../support/progress";

import { GlyphHintStore, IHintCacheManager } from "./common";
import { GhsToGlyphMap, hintGlyphSimple } from "./glyph";

export async function serialGlyphHint<GID>(
	font: IFontSource<GID>,
	passes: HintingPass[],
	cache: IHintCacheManager,
	forceSerial: boolean,
	logger: ILogger
) {
	let ghsMap: Map<string, GlyphHintStore> = new Map();
	for (const { uniqueID, plugin, parameters } of passes) {
		// Get the hinting model, skip if absent
		if (!forceSerial && plugin.adoptParallel) continue;

		const hm = plugin.adopt(font, parameters);
		if (!hm) continue;

		const ghs = new GlyphHintStore();
		const glyphs = await hm.analyzeEffectiveGlyphs();
		if (!glyphs) continue;

		const progress = new Progress(`${font.metadata.identifier} | ${plugin.type}`, glyphs.size);

		for (const glyph of glyphs) {
			const hinted = await hintGlyphSimple(font, hm, cache, ghs, glyph);
			progress.update(logger, !hinted);
		}
		progress.update(logger);

		// Hint the shared parts
		ghs.sharedHints = await hm.getSharedHints(await GhsToGlyphMap(font, ghs));
		ghsMap.set(uniqueID, ghs);
	}
	return ghsMap;
}
