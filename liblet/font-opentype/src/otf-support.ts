import {
	GlyphRelation,
	GlyphShape,
	IHint,
	IHintingModelPlugin,
	IHintStore
} from "@chlorophytum/arch";
import * as stream from "stream";

export type OpenTypeVariation = { [axis: string]: number };
export type OpenTypeMaster = { [axis: string]: { min: number; peak: number; max: number } };

export interface ISimpleGetMap<K, V> {
	get(key: K): V | undefined;
	[Symbol.iterator](): Iterable<[K, V]>;
	keys(): Iterable<K>;
	values(): Iterable<V>;
}
export interface ISimpleGetBimap<K, V> extends ISimpleGetMap<K, V> {
	coGet(value: V): K | undefined;
}
export interface GsubRelation<Glyph> extends GlyphRelation<Glyph> {
	readonly script: string;
	readonly language: string;
	readonly feature: string;
	readonly lookupID: string;
}
export interface IOpenTypeFileSupport<Glyph> {
	readonly glyphSet: ISimpleGetBimap<string, Glyph>;
	readonly cmap: ISimpleGetMap<number, Glyph>;
	getGeometry(glyph: Glyph, instance: null | OpenTypeVariation): Promise<GlyphShape>;
	getGsubRelatedGlyphs(source: Glyph): Promise<GsubRelation<Glyph>[]>;
	getGlyphMasters(glyph: Glyph): Promise<{ peak: OpenTypeVariation; master: OpenTypeMaster }[]>;

	readonly hsSupport: IOpenTypeHsSupport;
}

export interface IOpenTypeHsSupport {
	saveHintStore(
		glyphHints: Map<string, IHint>,
		sharedHints: Map<string, IHint>,
		output: stream.Writable
	): Promise<void>;
	populateHintStore(
		input: stream.Readable,
		models: IHintingModelPlugin[],
		store: IHintStore
	): Promise<void>;
}
