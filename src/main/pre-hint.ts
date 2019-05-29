import { IFontSource, IHintingModelFactory } from "../interfaces";

export default function preHint<GID, VAR, MASTER>(
	font: IFontSource<GID, VAR, MASTER>,
	modelFactories: IHintingModelFactory[]
) {
	const hs = font.createHintStore();
	for (const mf of modelFactories) {
		const hm = mf.adopt(font);
		if (!hm) continue;
		const glyphs = hm.analyzeSharedParameters(font);
		if (!glyphs) continue;
		for (const glyph of glyphs) {
			const gsa = hm.createGlyphAnalyzer();
			const geom0 = font.getGeometry(glyph, null);
			gsa.analyzeTopology(geom0);
			const masters = font.getGlyphMasters(glyph);
			for (const { peak, master } of masters) {
				const geomV = font.getGeometry(glyph, peak);
				gsa.analyzeVariance(peak, master, geomV);
			}
			hs.setGlyphHints(glyph, gsa.getHints());
		}
		hs.setSharedHints(hm.type, hm.getSharedHints());
	}
	return hs;
}
