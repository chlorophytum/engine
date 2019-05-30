import { GlyphGeometry, IFontSource, IHint } from "../interfaces";

export type OTVariation = { readonly [axis: string]: number };
export type OTMaster = {
	readonly [axis: string]: { readonly min: number; readonly peak: number; readonly max: number };
};

export abstract class IOpenType<Glyph> implements IFontSource<Glyph, OTVariation, OTMaster> {
	abstract readonly format: string;

	abstract getGlyphFromName(name: string): Glyph | undefined;
	abstract getUniqueGlyphName(glyph: Glyph): string;
	abstract getCharacterSet(): Set<number>;
	abstract getGlyphSet(): Set<Glyph>;
	abstract getEncodedGlyph(codePoint: number): Glyph | null | undefined;
	abstract getRelatedGlyphs(from: Glyph): Glyph[] | null | undefined;
	abstract getComponentGlyphs(from: Glyph): Glyph[] | null | undefined;

	abstract getGlyphMasters(glyph: Glyph): { peak: OTVariation; master: OTMaster }[];
	abstract getGeometry(glyph: Glyph, instance: null | OTVariation): GlyphGeometry;

	abstract createHintStore(): OTHintStore;
}

export class OTHintStore {
	private m_GlyphHints = new Map<string, IHint>();
	private m_sharedHints = new Map<string, IHint>();

	listGlyphs() {
		return this.m_GlyphHints.keys();
	}
	getGlyphHints(gid: string) {
		return this.m_GlyphHints.get(gid);
	}
	setGlyphHints(gid: string, hints: IHint) {
		this.m_GlyphHints.set(gid, hints);
	}

	listSharedTypes() {
		return this.m_sharedHints.keys();
	}
	getSharedHints(type: string) {
		return this.m_GlyphHints.get(type);
	}
	setSharedHints(type: string, hints: IHint) {
		this.m_sharedHints.set(type + "", hints);
	}
}
