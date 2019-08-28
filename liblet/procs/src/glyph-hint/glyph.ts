import { IFontSource, IHint, IHintingModel } from "@chlorophytum/arch";

import { GlyphHintJobs, GlyphHintSender, GlyphHintStore } from "./common";

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

export class JobFilter {
	constructor(jobs: GlyphHintJobs) {
		this.sets = {};
		for (const type in jobs) {
			this.sets[type] = new Set(jobs[type]);
		}
	}
	private sets: { [type: string]: Set<string> };
	public has(type: string, gName: string) {
		if (!this.sets[type]) return false;
		return this.sets[type].has(gName);
	}
}

export async function hintGlyphWorker<GID, VAR, MASTER>(
	font: IFontSource<GID, VAR, MASTER>,
	hm: IHintingModel<GID>,
	ghs: GlyphHintSender,
	jf: JobFilter,
	glyph: GID
) {
	const gName = await font.getUniqueGlyphName(glyph);
	if (!gName) return false;
	if (!jf.has(hm.type, gName)) return false;

	const hints = await hm.analyzeGlyph(glyph);
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
