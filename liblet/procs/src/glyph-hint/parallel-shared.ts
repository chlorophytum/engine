import { HintingPass, IFontSource } from "@chlorophytum/arch";

import { GlyphHintStore } from "./common";
import { GhsToGlyphMap } from "./glyph";

export async function parallelGlyphHintShared<GID, VAR, MASTER>(
	font: IFontSource<GID, VAR, MASTER>,
	passes: HintingPass[],
	ghsMap: ReadonlyMap<string, GlyphHintStore>
) {
	for (const { uniqueID, plugin, parameters } of passes) {
		// Get the hinting model, skip if absent
		if (!plugin.adoptParallel) continue;
		const hm = plugin.adopt(font, parameters);
		if (!hm) continue;

		const ghs = ghsMap.get(uniqueID);
		if (!ghs) continue;

		// Hint the shared parts
		ghs.sharedHints = await hm.getSharedHints(await GhsToGlyphMap(font, ghs));
	}
}
