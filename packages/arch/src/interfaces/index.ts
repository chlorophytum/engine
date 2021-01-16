/* eslint-disable @typescript-eslint/no-explicit-any */
import { Typable } from "typable";

import { Glyph } from "./geometry";
import { PropertyBag } from "./property-bag";
import { IParallelTaskFactory, ITask } from "./tasks";
import { Variation } from "./variation";

export { Geometry, Glyph } from "./geometry";
export * from "./property-bag";
export * from "./tasks";
export { Variation } from "./variation";

// Font source
export interface IFontFormat {
	// IO
	loadFont(path: string, identifier: string): Promise<IFontSource<any>>;

	createPreStatAnalyzer(pss: IFinalHintPreStatSink): Promise<null | IFinalHintPreStatAnalyzer>;
	createFinalHintSessionConnection(
		collector: IFinalHintCollector
	): Promise<null | IFinalHintSessionConnection>;
	createFinalHintIntegrator(fontPath: string): Promise<IFinalHintIntegrator>;
	getFinalHintFormat(): Promise<IFinalHintFormat>;
}
export interface IFinalHintSessionConnection {
	connectFont(path: string): Promise<null | IFinalHintSession>;
}
export interface IFinalHintPreStatAnalyzer {
	analyzeFontPreStat(path: string): Promise<void>;
}
export interface IFinalHintIntegrator {
	apply(collector: IFinalHintCollector, fhs: IFinalHintSession): Promise<void>;
	save(output: string): Promise<void>;
}

export interface IFontSource<GID> {
	readonly format: string;
	// Get font metadata
	readonly metadata: IFontSourceMetadata;
	// Get dimensions of variation
	getVariationDimensions(): Promise<ReadonlyArray<string>>;
	// Get range and stops of this variation dimension
	getRangeAndStopsOfVariationDimension(
		dim: string
	): Promise<ReadonlyArray<readonly [number, number]> | null | undefined>;
	// Conversion from user variation to normalized variation
	// Input datatype is explicitly chosen to be different from normalized instance
	convertUserInstanceToNormalized(
		user: Variation.UserInstance
	): Promise<Variation.Instance | null | undefined>;
	// Conversion from user master to normalized master
	// Input datatype is explicitly chosen to be different from normalized instance
	convertUserMasterToNormalized(
		user: Variation.UserMaster
	): Promise<Variation.Master | null | undefined>;
	// Get entry points
	getEntries(): Promise<ReadonlyArray<IFontEntry<GID>>>;
	// Glyph names
	getGlyphFromName(name: string): Promise<GID | undefined>;
	getUniqueGlyphName(glyph: GID): Promise<string | undefined>;
	// Get master list
	getGlyphMasters(glyph: GID): Promise<ReadonlyArray<Variation.MasterRep>>;
	// Get geometry
	getGeometry(glyph: GID, instance: null | Variation.Instance): Promise<Glyph.Shape>;
	// Get metric
	getMetric(glyph: GID, instance: null | Variation.Instance): Promise<Glyph.Metric>;
}
export interface IFontEntry<GID> {
	// Glyph set and encoding
	getGlyphSet(): Promise<Set<GID>>;
	getCharacterSet(): Promise<Set<number>>;
	getEncodedGlyph(codePoint: number): Promise<GID | null | undefined>;
	// Get related glyphs
	getRelatedGlyphs(
		from: GID,
		codePoint?: number
	): Promise<Glyph.Relation<GID>[] | null | undefined>;
}
export interface IFontSourceMetadata {
	readonly identifier: string;
	readonly upm: number;
}

// Hint store
export interface IHintStoreProvider {
	connectRead(identifier: string, passes: IHintingPass): Promise<IHintStore>;
	connectWrite(identifier: string, passes: IHintingPass): Promise<IHintStore>;
}
export interface IHintStore {
	listGlyphs(): Promise<Iterable<string>>;
	getGlyphHints(glyph: string): Promise<IHint | null | undefined>;
	setGlyphHints(glyph: string, hint: IHint): Promise<void>;
	getGlyphHintsCacheKey(glyph: string): Promise<null | undefined | string>;
	setGlyphHintsCacheKey(glyph: string, ck: string): Promise<void>;
	listSharedTypes(): Promise<Iterable<string>>;
	getSharedHints(type: string): Promise<IHint | null | undefined>;
	setSharedHints(type: string, hint: IHint): Promise<void>;

	commitChanges(): Promise<void>;
	disconnect(): Promise<void>;
}

// Visual hints are geometry-invariant
export interface IHint {
	toJSON(): any;
	createCompiler(bag: PropertyBag, font: IFinalHintProgramSink): IHintCompiler | null | undefined;
	traverse(bag: PropertyBag, traveller: IHintTraveller): void;
}
export interface IHintTraveller {
	traverse(bag: PropertyBag, hint: IHint): void;
}
export interface IHintFactory {
	readonly type: string;
	readJson(json: any, general: IHintFactory): IHint | null | undefined;
}
export interface IHintCompiler {
	doCompile(): void;
}

// Shape analysis (auto hinting)
export interface IHintingModelExecEnv {
	/// Font index
	readonly fontIndex: number;
	/// Quantity of fonts
	readonly totalFonts: number;
	/// Model-local hint store
	readonly hintStore: IHintStore;
	/// Global cache manager
	readonly cacheManager: IHintCacheManager;
	/// Global hint factory
	readonly hintFactory: IHintFactory;
	/// Property bag carried over hinting passes
	readonly carry: PropertyBag;
}
export interface IHintingModelPreEnv {
	/// Round
	readonly round: number;
	/// Font index
	readonly fontIndex: number;
	/// Quantity of fonts
	readonly totalFonts: number;
	/// Property bag carried over hinting passes
	readonly carry: PropertyBag;
}
export interface IHintCacheManager {
	getCache(ck: string): null | undefined | IHint;
	setCache(ck: string, hints: IHint): void;
}
export interface IHintingModel {
	readonly type: string;
	getPreTask?(env: IHintingModelPreEnv): null | ITask<unknown>;
	getHintingTask(env: IHintingModelExecEnv): null | ITask<unknown>;
}
export interface IHintingPass extends IParallelTaskFactory {
	readonly requirePreHintRounds: number;
	readonly factoriesOfUsedHints: ReadonlyArray<IHintFactory>;
	adopt<GID>(font: IFontSource<GID>): IHintingModel | null | undefined;
}

// Hint compilation (instructing)

export interface IFinalHintFormat {
	createFinalHintCollector(preStat: IFinalHintPreStatSink): Promise<IFinalHintCollector>;
	createPreStatSink(): Promise<IFinalHintPreStatSink>;
}
export interface IFinalHintPreStatSink extends Typable {
	settleDown(): void;
}
export interface IFinalHintCollector extends Typable {
	readonly format: string;
	consolidate(): void;
}
export interface IFinalHintSession extends Typable {
	readonly format: string;
	createGlyphProgramSink(
		gid: string,
		glyphCacheKey?: null | undefined | string
	): Promise<IFinalHintProgramSink>;
	createSharedProgramSink(type: string): Promise<IFinalHintProgramSink>;
	consolidate(): void;
}
export interface IFinalHintProgramSink extends Typable {
	readonly format: string;
	save(): void;
}

// Logging
export interface ILogger {
	bullet(prefix: string): ILogger;
	indent(prefix: string): ILogger;
	log(what: string): void;
}
