import { GlyphRelation, GlyphShape } from "@chlorophytum/arch";

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
	getGeometry(glyph: Glyph, instance: null | OpenTypeVariation): GlyphShape;
	getGsubRelatedGlyphs(source: Glyph): GsubRelation<Glyph>[];
	getGlyphMasters(glyph: Glyph): { peak: OpenTypeVariation; master: OpenTypeMaster }[];
	getGeometry(glyph: Glyph, instance: null | OpenTypeVariation): GlyphShape;
}
