import { HintingModelConfig, IFontSource, IHintingModelPlugin, ILogger } from "@chlorophytum/arch";

import { Progress } from "../support/progress";

import { findMatchingFactory, GlyphHintStore } from "./common";
import { GhsToGlyphMap, hintGlyphSimple } from "./glyph";

export async function serialGlyphHint<GID, VAR, MASTER>(
	font: IFontSource<GID, VAR, MASTER>,
	modelFactories: IHintingModelPlugin[],
	modelConfig: HintingModelConfig[],
	forceSerial: boolean,
	logger: ILogger
) {
	let ghsMap: Map<string, GlyphHintStore> = new Map();
	for (const { type, parameters } of modelConfig) {
		// Get the hinting model, skip if absent
		const mf = findMatchingFactory(type, modelFactories);
		if (!mf) continue;
		if (!forceSerial && mf.adoptParallel) continue;

		const hm = mf.adopt(font, parameters);
		if (!hm) continue;

		const ghs = new GlyphHintStore();
		const glyphs = await hm.analyzeEffectiveGlyphs();
		if (!glyphs) continue;

		const progress = new Progress(`${font.metadata.identifier} | ${type}`, glyphs.size);

		for (const glyph of glyphs) {
			const hinted = await hintGlyphSimple(font, hm, ghs, glyph);
			progress.update(logger, !hinted);
		}
		progress.update(logger);

		// Hint the shared parts
		ghs.sharedHints = await hm.getSharedHints(await GhsToGlyphMap(font, ghs));
		ghsMap.set(hm.type, ghs);
	}
	return ghsMap;
}
