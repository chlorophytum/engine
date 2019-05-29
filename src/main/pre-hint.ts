import { IFontSource, IHintingModelFactory } from "../interfaces";

export default function preHint<GID, VAR, MASTER>(
	font: IFontSource<GID, VAR, MASTER>,
	modelFactories: IHintingModelFactory[]
) {
	const hs = font.createHintStore();
	for (const mf of modelFactories) {
		const hm = mf.adopt(font);
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
