import { HintingModelConfig, IFontSource, IHintingModelFactory } from "../interfaces";

function findMatchingFactory(type: string, modelFactories: IHintingModelFactory[]) {
	for (const mf of modelFactories) if (mf.type === type) return mf;
	return null;
}

export default function preHint<GID, VAR, MASTER>(
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
		const glyphs = hm.analyzeSharedParameters();
		if (!glyphs) continue;
		for (const glyph of glyphs) {
			hs.setGlyphHints(font.getUniqueGlyphName(glyph), hm.analyzeGlyph(glyph));
		}
		hs.setSharedHints(hm.type, hm.getSharedHints());
	}
	return hs;
}
