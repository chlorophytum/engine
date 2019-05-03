import {
	Glyph,
	IFontEntry,
	IFontSource,
	Variation,
	WellKnownGlyphRelation
} from "@chlorophytum/arch";

import { evaluateUnicodeSubRange, UnicodeSubRange } from "./unicode-sub-range";

const DefaultLookupKinds = [`gsub_single`, `gsub_multiple`, `gsub_alternate`];

export interface GlyphSelector {
	readonly unicodeRange: UnicodeSubRange;
	readonly trackScripts: ReadonlyArray<string>;
	readonly trackFeatures: ReadonlyArray<string>;
}

export class ProxyFontSource<GID> implements IFontSource<GID> {
	constructor(
		private original: IFontSource<GID>,
		private selector: GlyphSelector
	) {}
	get format() {
		return this.original.format;
	}
	get metadata() {
		return this.original.metadata;
	}
	getVariationDimensions() {
		return this.original.getVariationDimensions();
	}
	getRangeAndStopsOfVariationDimension(dim: string) {
		return this.original.getRangeAndStopsOfVariationDimension(dim);
	}
	convertUserInstanceToNormalized(user: Variation.UserInstance) {
		return this.original.convertUserInstanceToNormalized(user);
	}
	convertUserMasterToNormalized(user: Variation.UserMaster) {
		return this.original.convertUserMasterToNormalized(user);
	}
	async getEntries() {
		const entries = await this.original.getEntries();
		return entries.map(e => new ProxyFontEntry(e, this.selector));
	}
	getGlyphFromName(name: string) {
		return this.original.getGlyphFromName(name);
	}
	getUniqueGlyphName(glyph: GID) {
		return this.original.getUniqueGlyphName(glyph);
	}
	getGlyphMasters(glyph: GID) {
		return this.original.getGlyphMasters(glyph);
	}
	getGeometry(glyph: GID, instance: null | Variation.Instance) {
		return this.original.getGeometry(glyph, instance);
	}
	getMetric(glyph: GID, instance: null | Variation.Instance) {
		return this.original.getMetric(glyph, instance);
	}
}

class ProxyFontEntry<GID> implements IFontEntry<GID> {
	private acceptableLookupKinds: ReadonlySet<string>;
	private acceptableScriptTags: ReadonlySet<string>;
	private acceptableFeatureTags: ReadonlySet<string>;
	private acceptableUnicode: ReadonlySet<number>;

	private collectedGlyphSet: null | Set<GID> = null;

	constructor(
		private origEntry: IFontEntry<GID>,
		selector: GlyphSelector
	) {
		this.acceptableLookupKinds = new Set(DefaultLookupKinds);
		this.acceptableScriptTags = new Set(selector.trackScripts);
		this.acceptableFeatureTags = new Set(selector.trackFeatures);
		this.acceptableUnicode = evaluateUnicodeSubRange(selector.unicodeRange);
	}
	async getGlyphSet() {
		if (this.collectedGlyphSet) return this.collectedGlyphSet;
		this.collectedGlyphSet = new Set();
		for (const ch of await this.getCharacterSet()) {
			await this.analyzeEffectiveGlyphsForChar(this.collectedGlyphSet, ch);
		}
		return this.collectedGlyphSet;
	}
	async getCharacterSet() {
		const orig = await this.origEntry.getCharacterSet();
		const filtered = new Set<number>();
		for (const ch of orig) if (this.acceptableUnicode.has(ch)) filtered.add(ch);
		return filtered;
	}
	async getEncodedGlyph(codePoint: number) {
		if (!this.acceptableUnicode.has(codePoint)) return undefined;
		return await this.origEntry.getEncodedGlyph(codePoint);
	}
	async getRelatedGlyphs(from: GID, codePoint?: number) {
		const orig = await this.origEntry.getRelatedGlyphs(from, codePoint);
		if (!orig) return orig;
		const gs = await this.getGlyphSet();
		const filtered: Glyph.Relation<GID>[] = [];
		for (const gr of orig) {
			if (gs.has(gr.target)) filtered.push(gr);
		}
		return filtered;
	}

	private async analyzeEffectiveGlyphsForChar(sink: Set<GID>, ch: number) {
		if (!this.acceptableUnicode.has(ch)) return;
		const gid = await this.origEntry.getEncodedGlyph(ch);
		if (!gid) return;
		sink.add(gid);
		const related = await this.origEntry.getRelatedGlyphs(gid, ch);
		if (!related) return;
		for (const { target, relationTag } of related) {
			if (this.relationshipAcceptable(relationTag)) sink.add(target);
		}
	}
	private relationshipAcceptable(relationTag: string) {
		const selector = WellKnownGlyphRelation.UnicodeVariant.unApply(relationTag);
		if (selector) return true;

		const gsub = WellKnownGlyphRelation.Gsub.unApply(relationTag);
		if (!gsub) return false;
		const [script, language, feature, kind] = gsub;
		return (
			this.acceptableScriptTags.has(script) &&
			this.acceptableFeatureTags.has(feature.slice(0, 4)) &&
			this.acceptableLookupKinds.has(kind)
		);
	}
}
