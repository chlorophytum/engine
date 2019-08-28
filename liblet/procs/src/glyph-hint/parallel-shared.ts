import { HintingModelConfig, IFontSource, IHintingModelPlugin } from "@chlorophytum/arch";

import { findMatchingFactory, GlyphHintStore } from "./common";
import { GhsToGlyphMap } from "./glyph";

export async function parallelGlyphHintShared<GID, VAR, MASTER>(
	font: IFontSource<GID, VAR, MASTER>,
	modelFactories: IHintingModelPlugin[],
	modelConfig: HintingModelConfig[],
	ghsMap: ReadonlyMap<string, GlyphHintStore>
) {
	for (const { type, parameters } of modelConfig) {
		// Get the hinting model, skip if absent
		const mf = findMatchingFactory(type, modelFactories);
		if (!mf) continue;
		const hm = mf.adopt(font, parameters);
		if (!hm) continue;
		if (!hm.allowParallel) continue;

		const ghs = ghsMap.get(hm.type);
		if (!ghs) continue;

		// Hint the shared parts
		ghs.sharedHints = await hm.getSharedHints(await GhsToGlyphMap(font, ghs));
	}
}
