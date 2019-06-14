import { HintingModelConfig, IFontSource, IHintingModelFactory } from "../interfaces";

function findMatchingFactory(type: string, modelFactories: IHintingModelFactory[]) {
	for (const mf of modelFactories) if (mf.type === type) return mf;
	return null;
}

export default async function preHint<GID, VAR, MASTER>(
	font: IFontSource<GID, VAR, MASTER>,
	modelFactories: IHintingModelFactory[],
	modelConfig: HintingModelConfig[]
) {
	const hs = font.createHintStore();
	for (const { type, parameters } of modelConfig) {
		const mf = findMatchingFactory(type, modelFactories);
		if (!mf) continue;
		const hm = mf.adopt(font, parameters);
		if (!hm) continue;
		const glyphs = await hm.analyzeSharedParameters();
		if (!glyphs) continue;
		for (const glyph of glyphs) {
			const gName = await font.getUniqueGlyphName(glyph);
			if (!gName) continue;
			const hints = await hm.analyzeGlyph(glyph);
			if (hints) await hs.setGlyphHints(gName, hints);
		}

		const sharedHints = await hm.getSharedHints();
		if (sharedHints) await hs.setSharedHints(hm.type, sharedHints);
	}
	return hs;
}
