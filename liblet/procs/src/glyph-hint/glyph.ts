import {
	GlyphRep,
	IFontSource,
	IHint,
	IHintingModel,
	IParallelHintingModel
} from "@chlorophytum/arch";

import { GlyphHintJobs, GlyphHintRequest, GlyphHintSender, GlyphHintStore } from "./common";

export async function hintGlyphSimple<GID, VAR, MASTER>(
	font: IFontSource<GID, VAR, MASTER>,
	hm: IHintingModel<GID>,
	hs: GlyphHintStore,
	glyph: GID
) {
	const gName = await font.getUniqueGlyphName(glyph);
	if (!gName) return false;

	const hints = await hm.analyzeGlyph(glyph);
	if (hints) hs.glyphHints.set(gName, hints);
	return true;
}

export async function hintGlyphWorker<VAR, MASTER>(
	hm: IParallelHintingModel<VAR, MASTER>,
	ghs: GlyphHintSender,
	gName: string,
	glyphRep: GlyphRep<VAR, MASTER>
) {
	const hints = await hm.analyzeGlyph(glyphRep);
	if (hints) ghs.push(hm.type, gName, hints);
	return true;
}

export async function GhsToGlyphMap<GID, VAR, MASTER>(
	font: IFontSource<GID, VAR, MASTER>,
	ghs: GlyphHintStore
) {
	const ghm: Map<GID, IHint> = new Map();
	for (const [gName, hint] of ghs.glyphHints) {
		if (!hint || !gName) continue;
		const glyph = await font.getGlyphFromName(gName);
		if (glyph == null) continue;
		ghm.set(glyph, hint);
	}
	return ghm;
}
