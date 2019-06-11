import { IHint, IHintStore } from "@chlorophytum/arch";

export class OpenTypeHintStore implements IHintStore {
	private glyphHints = new Map<string, IHint>();
	private sharedHintTypes = new Map<string, IHint>();

	public listGlyphs() {
		return this.glyphHints.keys();
	}
	public getGlyphHints(glyph: string) {
		return this.glyphHints.get(glyph);
	}
	public setGlyphHints(glyph: string, hint: IHint) {
		return this.glyphHints.set(glyph, hint);
	}
	public listSharedTypes() {
		return this.sharedHintTypes.keys();
	}
	public getSharedHints(type: string) {
		return this.sharedHintTypes.get(type);
	}
	public setSharedHints(type: string, hint: IHint) {
		return this.sharedHintTypes.set(type, hint);
	}
}
