import * as stream from "stream";

import { Glyph } from "./geometry";
import { IParallelTaskFactory, ITask } from "./tasks";
import { Variation } from "./variation";

export { Geometry, Glyph } from "./geometry";
export { Variation } from "./variation";

export * from "./tasks";

// Font source
export interface IFontFormatPlugin {
	// "any"s are actually existential types
	createFontSource(path: string, identifier: string): Promise<IFontSource<any>>;
	createPreStatAnalyzer(pss: IFinalHintPreStatSink): null | IFinalHintPreStatAnalyzer;
	createFinalHintSaver(collector: IFinalHintCollector): null | IFontFinalHintSaver;
	createFinalHintIntegrator(): IFontFinalHintIntegrator;
}
export interface IFinalHintPreStatAnalyzer {
	analyzeFontPreStat(font: stream.Readable): Promise<void>;
}
export interface IFontFinalHintSaver {
	saveFinalHint(fhs: IFinalHintSession, output: stream.Writable): Promise<void>;
}
export interface IFontFinalHintIntegrator {
	integrateFinalHintsToFont(hints: string, font: string, output: string): Promise<void>;
	integrateGlyphFinalHintsToFont(hints: string, font: string, output: string): Promise<void>;
}
export interface IFontSourceMetadata {
	readonly identifier: string;
	readonly upm: number;
}
export interface IFontSource<GID> {
	readonly format: string;

	readonly metadata: IFontSourceMetadata;

	getGlyphFromName(name: string): Promise<GID | undefined>;
	getUniqueGlyphName(glyph: GID): Promise<string | undefined>;
	getCharacterSet(): Promise<Set<number>>;
	getGlyphSet(): Promise<Set<GID>>;
	// Get a glyph ID from a font
	getEncodedGlyph(codePoint: number): Promise<GID | null | undefined>;
	// Get related glyphs
	getRelatedGlyphs(
		from: GID,
		codePoint?: number
	): Promise<Glyph.Relation<GID>[] | null | undefined>;
	// Get master list
	getGlyphMasters(glyph: GID): Promise<ReadonlyArray<Variation.MasterRep>>;
	// Get geometry
	getGeometry(glyph: GID, instance: null | Variation.Instance): Promise<Glyph.Shape>;
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
	createCompiler(font: IFinalHintProgramSink): IHintCompiler | null | undefined;
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
	readonly passUniqueID: string;
	readonly modelLocalHintStore: IHintStore;
	readonly cacheManager: IHintCacheManager;
	readonly hintFactory: IHintFactory;
}
export interface IHintCacheManager {
	getCache(ck: string): null | undefined | IHint;
	setCache(ck: string, hints: IHint): void;
}
export interface IHintingModel {
	readonly type: string;
	readonly allowParallel: boolean;
	getHintingTask(env: IHintingModelExecEnv): null | ITask<unknown>;
}
export interface IParallelHintingModel {
	readonly type: string;
	analyzeGlyph(shape: Glyph.Rep): Promise<null | IHint>;
}
export interface IHintingModelPlugin extends IParallelTaskFactory {
	readonly type: string;
	adopt<GID>(font: IFontSource<GID>, parameters: any): IHintingModel | null | undefined;
	hintFactories: IHintFactory[];
}
export interface HintingPass {
	readonly plugin: IHintingModelPlugin;
	readonly uniqueID: string;
	readonly parameters?: any;
}

// Hint compilation (instructing)

export interface IFinalHintPlugin {
	createFinalHintCollector(preStat: IFinalHintPreStatSink): IFinalHintCollector;
	createPreStatSink(): IFinalHintPreStatSink;
}
export interface IFinalHintPreStatSink {
	settleDown(): void;
}
export interface IFinalHintCollector {
	readonly format: string;
	createSession(): IFinalHintSession;
	consolidate(): void;
}
export interface IFinalHintSession {
	readonly format: string;
	createGlyphProgramSink(
		gid: string,
		glyphCacheKey?: null | undefined | string
	): IFinalHintProgramSink;
	createSharedProgramSink(type: string): IFinalHintProgramSink;
	consolidate(): void;
}
export interface IFinalHintProgramSink {
	readonly format: string;
	save(): void;
}

// Logging
export interface ILogger {
	bullet(prefix: string): ILogger;
	indent(prefix: string): ILogger;
	log(what: string): void;
}
