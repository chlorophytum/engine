import { Glyph, IHintingModelPlugin, IHintStore, Variation } from "@chlorophytum/arch";
import * as stream from "stream";

import { OpenTypeHintStore } from "./hint-store";

export interface ISimpleGetMap<K, V> {
	get(key: K): V | undefined;
	[Symbol.iterator](): Iterable<[K, V]>;
	keys(): Iterable<K>;
	values(): Iterable<V>;
}
export interface ISimpleGetBimap<K, V> extends ISimpleGetMap<K, V> {
	coGet(value: V): K | undefined;
}
export interface GsubRelation<GID> extends Glyph.Relation<GID> {
	readonly script: string;
	readonly language: string;
	readonly feature: string;
	readonly lookupID: string;
}
export interface IOpenTypeFileSupport<GID> {
	readonly glyphSet: ISimpleGetBimap<string, GID>;
	readonly cmap: ISimpleGetMap<number, GID>;
	getGeometry(glyph: GID, instance: null | Variation.Instance): Promise<Glyph.Shape>;
	getGsubRelatedGlyphs(source: GID): Promise<GsubRelation<GID>[]>;
	getGlyphMasters(glyph: GID): Promise<Variation.MasterRep[]>;

	readonly hsSupport: IOpenTypeHsSupport;
}

export interface IOpenTypeHsSupport {
	saveHintStore(hs: OpenTypeHintStore, output: stream.Writable): Promise<void>;
	populateHintStore(
		input: stream.Readable,
		models: IHintingModelPlugin[],
		store: IHintStore
	): Promise<void>;
}
