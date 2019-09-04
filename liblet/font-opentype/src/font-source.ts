import {
	Glyph,
	IFontSource,
	IFontSourceMetadata,
	Variation,
	WellKnownGlyphRelation
} from "@chlorophytum/arch";

import { OpenTypeHintStore } from "./hint-store";
import { IOpenTypeFileSupport } from "./otf-support";

export abstract class OpenTypeFont<GID> implements IFontSource<GID> {
	protected abstract support: IOpenTypeFileSupport<GID>;

	public abstract readonly format: string;
	public abstract readonly metadata: IFontSourceMetadata;

	public async getGlyphFromName(name: string) {
		return this.support.glyphSet.get(name);
	}
	public async getUniqueGlyphName(glyph: GID) {
		return this.support.glyphSet.coGet(glyph);
	}
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
	public async getGlyphMasters(glyph: GID) {
		return await this.support.getGlyphMasters(glyph);
	}
	public async getGeometry(glyph: GID, instance: null | Variation.Instance) {
		return await this.support.getGeometry(glyph, instance);
	}
	public createHintStore() {
		return new OpenTypeHintStore(this.support.hsSupport);
	}
}
