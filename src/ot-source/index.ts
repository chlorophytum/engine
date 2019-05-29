import { GlyphGeometry, IFontSource, IHint } from "../interfaces";

export type OTVariation = { readonly [axis: string]: number };
export type OTMaster = {
	readonly [axis: string]: { readonly min: number; readonly peak: number; readonly max: number };
};

export abstract class IOpenType<GID> implements IFontSource<GID, OTVariation, OTMaster> {
	abstract readonly format: string;
	abstract getCharacterSet(): Set<number>;
	abstract getGlyphSet(): Set<GID>;
	abstract getEncodedGlyph(codePoint: number): GID | null | undefined; // Get a glyph ID from a font
	abstract getRelatedGlyphs(from: GID): GID[] | null | undefined; // Get related glyphs
	abstract getComponentGlyphs(from: GID): GID[] | null | undefined; // Get dependent glyphs, usually components

	abstract getGlyphMasters(glyph: GID): { peak: OTVariation; master: OTMaster }[]; // Get master list
	abstract getGeometry(glyph: GID, instance: null | OTVariation): GlyphGeometry; // Get geometry

	abstract createHintStore(): OTHintStore<GID>;
}

export class OTHintStore<GID> {
	private m_GlyphHints = new Map<string, any>();
	private m_sharedHints = new Map<string, any>();

	setGlyphHints(glyph: GID, hints: IHint[]) {
		let dat: any[] = [];
		for (const hint of hints) {
			dat.push(hint.toJSON());
		}
		this.m_GlyphHints.set(glyph + "", dat);
	}
	setSharedHints(type: string, hints: IHint[]) {
		let dat: any[] = [];
		for (const hint of hints) {
			dat.push(hint.toJSON());
		}
		this.m_sharedHints.set(type + "", dat);
	}
}
