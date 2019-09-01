import * as stream from "stream";

// Geometry data
export interface Point {
	readonly x: number;
	readonly y: number;
}
export interface GlyphPoint {
	readonly x: number;
	readonly y: number;
	readonly on: boolean;
	readonly id: number;
}
export type GlyphGeometry = readonly GlyphPoint[][];
export interface GlyphShapeComponent {
	readonly shape: GlyphShape; // Shape of resulting geometry, transformed
}
export interface GlyphShape {
	readonly eigen: GlyphGeometry;
	readonly compositionOperator?: string;
	readonly components?: GlyphShapeComponent;
}
export interface GlyphRelation<Glyph> {
	readonly target: Glyph;
	readonly relationTag: string;
}

export type MasterRep<VAR, MASTER> = { peak: VAR; master: MASTER };
export interface GlyphRep<VAR, MASTER> {
	readonly shapes: [null | MasterRep<VAR, MASTER>, GlyphShape][];
}

// Font source
export interface IFontFormatPlugin {
	// "any"s are actually existential types
	createFontSource(
		input: stream.Readable,
		identifier: string
	): Promise<IFontSource<any, any, any>>;
	createPreStatAnalyzer(pss: IFinalHintPreStatSink): null | IFinalHintPreStatAnalyzer;
	createHintStore(input: stream.Readable, plugins: IHintingModelPlugin[]): Promise<IHintStore>;
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
	integrateFinalHintsToFont(
		hints: stream.Readable,
		font: stream.Readable,
		output: stream.Writable
	): Promise<void>;
}
export interface IFontSourceMetadata {
	readonly identifier: string;
	readonly upm: number;
}
export interface IFontSource<Glyph, VAR, MASTER> {
	readonly format: string;

	readonly metadata: IFontSourceMetadata;

	getGlyphFromName(name: string): Promise<Glyph | undefined>;
	getUniqueGlyphName(glyph: Glyph): Promise<string | undefined>;
	getCharacterSet(): Promise<Set<number>>;
	getGlyphSet(): Promise<Set<Glyph>>;
	// Get a glyph ID from a font
	getEncodedGlyph(codePoint: number): Promise<Glyph | null | undefined>;
	// Get related glyphs
	getRelatedGlyphs(from: Glyph): Promise<GlyphRelation<Glyph>[] | null | undefined>;
	// Get master list
	getGlyphMasters(glyph: Glyph): Promise<ReadonlyArray<MasterRep<VAR, MASTER>>>;
	// Get geometry
	getGeometry(glyph: Glyph, instance: null | VAR): Promise<GlyphShape>;

	createHintStore(): IHintStore;
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
	save(stream: stream.Writable): Promise<void>;
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
export interface IHintingModel<Glyph> {
	readonly type: string;
	readonly allowParallel: boolean;
	// Analyze glyphs worth hinting
	analyzeEffectiveGlyphs(): Promise<null | Set<Glyph>>;
	// Caching -- Get the cache key of a glyph if usable
	getGlyphCacheKey(gid: Glyph): Promise<null | string>;
	// Analyze a glyph
	analyzeGlyph(gid: Glyph): Promise<null | IHint>;
	// Analyze shared hints
	getSharedHints(glyphHints: ReadonlyMap<Glyph, IHint>): Promise<null | IHint>;
}
export interface IParallelHintingModel<VAR, MASTER> {
	readonly type: string;
	analyzeGlyph(shape: GlyphRep<VAR, MASTER>): Promise<null | IHint>;
}
export interface IHintingModelPlugin {
	readonly type: string;
	adopt<GID, VAR, MASTER>(
		font: IFontSource<GID, VAR, MASTER>,
		parameters: any
	): IHintingModel<GID> | null | undefined;
	adoptParallel?<VAR, MASTER>(
		metadata: IFontSourceMetadata,
		parameters: any
	): IParallelHintingModel<VAR, MASTER> | null | undefined;
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
	log(what: string): void;
}
