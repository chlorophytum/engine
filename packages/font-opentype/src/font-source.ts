import {
	Glyph,
	IFontEntry,
	IFontSource,
	IFontSourceMetadata,
	Variation,
	WellKnownGlyphRelation
} from "@chlorophytum/arch";

import { IOpenTypeFontEntrySupport, IOpenTypeFontSourceSupport } from "./otf-support";

export abstract class OpenTypeFontSource<GID> implements IFontSource<GID> {
	public abstract format: string;
	protected abstract support: IOpenTypeFontSourceSupport<GID>;
	public abstract readonly metadata: IFontSourceMetadata;

	public abstract getEntries(): Promise<ReadonlyArray<OpenTypeFontEntry<GID>>>;
	public async getVariationDimensions() {
		return this.support.getVariationDimensions();
	}
	public async getRangeAndStopsOfVariationDimension(dim: string) {
		return this.support.getRangeAndStopsOfVariationDimension(dim);
	}
	public async convertUserInstanceToNormalized(user: Variation.UserInstance) {
		return this.support.convertUserInstanceToNormalized(user);
	}
	public async convertUserMasterToNormalized(user: Variation.UserMaster) {
		return this.support.convertUserMasterToNormalized(user);
	}
	public async getGlyphFromName(name: string) {
		return this.support.glyphSet.get(name);
	}
	public async getUniqueGlyphName(glyph: GID) {
		return this.support.glyphSet.coGet(glyph);
	}
	public async getGlyphMasters(glyph: GID) {
		return await this.support.getGlyphMasters(glyph);
	}
	public async getGeometry(glyph: GID, instance: null | Variation.Instance) {
		return await this.support.getGeometry(glyph, instance);
	}
	public async getMetric(glyph: GID, instance: null | Variation.Instance) {
		return await this.support.getMetric(glyph, instance);
	}
}

export abstract class OpenTypeFontEntry<GID> implements IFontEntry<GID> {
	protected abstract support: IOpenTypeFontEntrySupport<GID>;

	public async getCharacterSet() {
		return new Set(this.support.cmap.keys());
	}
	public async getGlyphSet() {
		return new Set(this.support.glyphSet.values());
	}
	public async getEncodedGlyph(codePoint: number) {
		return this.support.cmap.get(codePoint);
	}

	public async getRelatedGlyphs(source: GID, codePoint?: number) {
		let result: Glyph.Relation<GID>[] = [];
		const gsubRel = await this.support.getGsubRelatedGlyphs(source);
		for (const { target, script, language, feature, lookupKind } of gsubRel) {
			result.push({
				target,
				relationTag: WellKnownGlyphRelation.Gsub.apply(
					script,
					language,
					feature,
					lookupKind
				)
			});
		}
		if (codePoint) {
			const cmapRel = await this.support.getCmapRelatedGlyphs(source, codePoint);
			for (const { selector, target } of cmapRel) {
				result.push({
					target,
					relationTag: WellKnownGlyphRelation.UnicodeVariant.apply(selector)
				});
			}
		}
		return result;
	}
}
