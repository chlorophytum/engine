import { IHint, IHintStore } from "@chlorophytum/arch";

export class MemoryHintStore implements IHintStore {
	public glyphHints = new Map<string, IHint>();
	public glyphHintCacheKeys = new Map<string, string>();
	public sharedHints = new Map<string, IHint>();

	public async listGlyphs() {
		return this.glyphHints.keys();
	}
	public async getGlyphHints(glyph: string) {
		return this.glyphHints.get(glyph);
	}
	public async setGlyphHints(glyph: string, hint: IHint) {
		this.glyphHints.set(glyph, hint);
	}
	public async getGlyphHintsCacheKey(glyph: string) {
		return this.glyphHintCacheKeys.get(glyph);
	}
	public async setGlyphHintsCacheKey(glyph: string, ck: string) {
		this.glyphHintCacheKeys.set(glyph, ck);
	}
	public async listSharedTypes() {
		return this.sharedHints.keys();
	}
	public async getSharedHints(type: string) {
		return this.sharedHints.get(type);
	}
	public async setSharedHints(type: string, hint: IHint) {
		this.sharedHints.set(type, hint);
	}
	public async commitChanges() {}
	public async disconnect() {}
}
