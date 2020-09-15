import { Glyph, Variation } from "@chlorophytum/arch";

export interface ISimpleGetMap<K, V> {
	get(key: K): V | undefined;
	[Symbol.iterator](): Iterable<[K, V]>;
	keys(): Iterable<K>;
	values(): Iterable<V>;
}
export interface ISimpleGetBimap<K, V> extends ISimpleGetMap<K, V> {
	coGet(value: V): K | undefined;
}
export interface CmapRelation<GID> {
	readonly target: GID;
	readonly selector: number;
}
export interface GsubRelation<GID> {
	readonly target: GID;
	readonly script: string;
	readonly language: string;
	readonly feature: string;
	readonly lookupKind: string;
}

export interface IOpenTypeFontSourceSupport<GID> {
	readonly glyphSet: ISimpleGetBimap<string, GID>;
	getVariationDimensions(): Promise<ReadonlyArray<string>>;
	getGeometry(glyph: GID, instance: null | Variation.Instance): Promise<Glyph.Shape>;
	getMetric(glyph: GID, instance: null | Variation.Instance): Promise<Glyph.Metric>;
	getGlyphMasters(glyph: GID): Promise<Variation.MasterRep[]>;
}
export interface IOpenTypeFontEntrySupport<GID> {
	readonly glyphSet: ISimpleGetBimap<string, GID>;
	readonly cmap: ISimpleGetMap<number, GID>;
	getCmapRelatedGlyphs(source: GID, codePoint: number): Promise<CmapRelation<GID>[]>;
	getGsubRelatedGlyphs(source: GID): Promise<GsubRelation<GID>[]>;
}
