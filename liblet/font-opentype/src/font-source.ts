import { IFontSource, IFontSourceMetadata, IHintStore } from "@chlorophytum/arch";

import { OpenTypeHintStore } from "./hint-store";
import { IOpenTypeFileSupport, OpenTypeMaster, OpenTypeVariation } from "./otf-support";

export abstract class OpenTypeFont<Glyph>
	implements IFontSource<Glyph, OpenTypeVariation, OpenTypeMaster> {
	protected abstract support: IOpenTypeFileSupport<Glyph>;

	public abstract readonly format: string;
	public abstract readonly metadata: IFontSourceMetadata;

	public async getGlyphFromName(name: string) {
		return this.support.glyphSet.get(name);
	}
	public async getUniqueGlyphName(glyph: Glyph) {
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

	public async getRelatedGlyphs(source: Glyph) {
		return await this.support.getGsubRelatedGlyphs(source);
	}
	public async getGlyphMasters(glyph: Glyph) {
		return await this.support.getGlyphMasters(glyph);
	}
	public async getGeometry(glyph: Glyph, instance: null | OpenTypeVariation) {
		return await this.support.getGeometry(glyph, instance);
	}
	public createHintStore() {
		return new OpenTypeHintStore(this.support.hsSupport);
	}
}
