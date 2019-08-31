import {
	GlyphRep,
	IFontSource,
	IHint,
	IHintingModel,
	IParallelHintingModel
} from "@chlorophytum/arch";

import { GlyphHintRequest, GlyphHintSender, GlyphHintStore, IHintCacheManager } from "./common";

export async function hintGlyphSimple<GID, VAR, MASTER>(
	font: IFontSource<GID, VAR, MASTER>,
	hm: IHintingModel<GID>,
	cache: IHintCacheManager,
	hs: GlyphHintStore,
	glyph: GID
) {
	const gName = await font.getUniqueGlyphName(glyph);
	if (!gName) return false;

	const ckRaw = await hm.getGlyphCacheKey(glyph);
	const ck = ckRaw ? hm.type + "/" + ckRaw : "";
	const cachedHints = ck ? cache.getCache(ck) : null;

	if (ck) hs.glyphCacheKeys.set(gName, ck);
	const hints = cachedHints || (await hm.analyzeGlyph(glyph));
	if (hints) hs.glyphHints.set(gName, hints);
	if (ck && !cachedHints && hints) cache.setCache(ck, hints);
	return true;
}

export async function hintGlyphWorker<VAR, MASTER>(
	passID: string,
	hm: IParallelHintingModel<VAR, MASTER>,
	ghs: GlyphHintSender,
	req: GlyphHintRequest<VAR, MASTER>
) {
	const hints = await hm.analyzeGlyph(req.glyphRep);
	if (hints) ghs.push(passID, req.glyphName, req.cacheKey, hints);
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
