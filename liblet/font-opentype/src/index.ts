import { IFontSource, IFontSourceMetadata, IHintStore } from "@chlorophytum/arch";

import { OpenTypeHintStore } from "./hint-store";
import { IOpenTypeFileSupport, OpenTypeMaster, OpenTypeVariation } from "./otf-support";

export abstract class OpenTypeFont<Glyph>
	implements IFontSource<Glyph, OpenTypeVariation, OpenTypeMaster> {
	protected abstract support: IOpenTypeFileSupport<Glyph>;

	public abstract readonly format: string;
	public abstract readonly metadata: IFontSourceMetadata;

	public getGlyphFromName(name: string) {
		return this.support.glyphSet.get(name);
	}
	public getUniqueGlyphName(glyph: Glyph) {
		return this.support.glyphSet.coGet(glyph);
	}
	public getCharacterSet() {
		return new Set(this.support.cmap.keys());
	}
	public getGlyphSet() {
		return new Set(this.support.glyphSet.values());
	}
	public getEncodedGlyph(codePoint: number) {
		return this.support.cmap.get(codePoint);
	}

	public getRelatedGlyphs(source: Glyph) {
		return this.support.getGsubRelatedGlyphs(source);
	}
	public getGlyphMasters(glyph: Glyph) {
		return this.support.getGlyphMasters(glyph);
	}
	public getGeometry(glyph: Glyph, instance: null | OpenTypeVariation) {
		return this.support.getGeometry(glyph, instance);
	}
	public createHintStore() {
		return new OpenTypeHintStore();
	}
}
