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
export interface IFontFormatPlugin {
	// "any"s are actually existential types
	createFontLoader(path: string, identifier: string): IFontLoader;
	createPreStatAnalyzer(pss: IFinalHintPreStatSink): null | IFinalHintPreStatAnalyzer;
	createFinalHintSessionConnection(
		collector: IFinalHintCollector
	): null | IFinalHintSessionConnection;
	createFinalHintSaver(collector: IFinalHintCollector): null | IFontFinalHintSaver;
	createFinalHintIntegrator(): IFontFinalHintIntegrator;
}
export interface IFontLoader {
	load(): Promise<IFontSource<any>>;
}
export interface IFinalHintSessionConnection {
	connectFont(path: string): Promise<null | IFinalHintSession>;
}
export interface IFinalHintPreStatAnalyzer {
	analyzeFontPreStat(path: string): Promise<void>;
}
export interface IFontFinalHintSaver {
	saveFinalHint(fhs: IFinalHintSession, output: string): Promise<void>;
}
export interface IFontFinalHintIntegrator {
	integrateFinalHintsToFont(hints: string, font: string, output: string): Promise<void>;
	integrateGlyphFinalHintsToFont(hints: string, font: string, output: string): Promise<void>;
}

export interface IFontSource<GID> {
	readonly format: string;
	// Get font metadata
	readonly metadata: IFontSourceMetadata;
	// Get dimensions of variation
	getVariationDimensions(): Promise<ReadonlyArray<string>>;
	// Get entry points
	getEntries(): Promise<ReadonlyArray<IFontEntry<GID>>>;
	// Glyph names
	getGlyphFromName(name: string): Promise<GID | undefined>;
	getUniqueGlyphName(glyph: GID): Promise<string | undefined>;
	// Get master list
	getGlyphMasters(glyph: GID): Promise<ReadonlyArray<Variation.MasterRep>>;
	// Get geometry
	getGeometry(glyph: GID, instance: null | Variation.Instance): Promise<Glyph.Shape>;
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

// Hint store plugin
export interface IHintStoreProvider {
	connectRead(identifier: string, plugins: IHintingModelPlugin[]): Promise<IHintStore>;
	connectWrite(identifier: string, plugins: IHintingModelPlugin[]): Promise<IHintStore>;
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
	/// Unique identifier of pass
	readonly passUniqueID: string;
	/// Model-local hint store
	readonly modelLocalHintStore: IHintStore;
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
	/// Unique identifier of pass
	readonly passUniqueID: string;
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
export interface IHintingModelPlugin extends IParallelTaskFactory {
	// Type identifier
	readonly type: string;
	// Required rounds of pre-hinting
	readonly requiredPreHintRounds?: number;
	// HM creation for single font
	adopt<GID>(font: IFontSource<GID>, parameters: any): IHintingModel | null | undefined;
	// Reference all factories of all the visual hints that it would produce
	readonly factoriesOfUsedHints: ReadonlyArray<IHintFactory>;
}
export interface AutoHintingPass {
	readonly plugin: IHintingModelPlugin;
	readonly uniqueID: string;
	readonly parameters?: any;
}

// Hint compilation (instructing)

export interface IFinalHintPlugin {
	createFinalHintCollector(preStat: IFinalHintPreStatSink): IFinalHintCollector;
	createPreStatSink(): IFinalHintPreStatSink;
}
export interface IFinalHintPreStatSink extends Typable<{}> {
	settleDown(): void;
}
export interface IFinalHintCollector extends Typable<{}> {
	readonly format: string;
	consolidate(): void;
}
export interface IFinalHintSession extends Typable<{}> {
	readonly format: string;
	createGlyphProgramSink(
		gid: string,
		glyphCacheKey?: null | undefined | string
	): Promise<IFinalHintProgramSink>;
	createSharedProgramSink(type: string): Promise<IFinalHintProgramSink>;
	consolidate(): void;
}
export interface IFinalHintProgramSink extends Typable<{}> {
	readonly format: string;
	save(): void;
}

// Logging
export interface ILogger {
	bullet(prefix: string): ILogger;
	indent(prefix: string): ILogger;
	log(what: string): void;
}
