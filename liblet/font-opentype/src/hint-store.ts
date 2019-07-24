import { IHint, IHintStore } from "@chlorophytum/arch";
import * as stream from "stream";

import { IOpenTypeHsSupport } from "./otf-support";

export class OpenTypeHintStore implements IHintStore {
	private glyphHints = new Map<string, IHint>();
	private sharedHintTypes = new Map<string, IHint>();

	constructor(protected readonly support: IOpenTypeHsSupport) {}
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

	public save(stream: stream.Writable) {
		return this.support.saveHintStore(this.glyphHints, this.sharedHintTypes, stream);
	}
}
