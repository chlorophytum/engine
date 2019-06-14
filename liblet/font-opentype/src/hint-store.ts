import { IHint, IHintStore } from "@chlorophytum/arch";

export class OpenTypeHintStore implements IHintStore {
	private glyphHints = new Map<string, IHint>();
	private sharedHintTypes = new Map<string, IHint>();

	public async listGlyphs() {
		return this.glyphHints.keys();
	}
	public async getGlyphHints(glyph: string) {
		return this.glyphHints.get(glyph);
	}
	public async setGlyphHints(glyph: string, hint: IHint) {
		this.glyphHints.set(glyph, hint);
	}
	public async listSharedTypes() {
		return this.sharedHintTypes.keys();
	}
	public async getSharedHints(type: string) {
		return this.sharedHintTypes.get(type);
	}
	public async setSharedHints(type: string, hint: IHint) {
		this.sharedHintTypes.set(type, hint);
	}
}
