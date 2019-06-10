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
export type GlyphGeometry = GlyphPoint[][];

export interface IFontSourceFactory {
	// "any"s are actually existential types
	createFontSourceFromFile(path: string): Promise<IFontSource<any, any, any>>;
	createHintStoreFromFile(path: string): Promise<IHintStore>;
}
export interface IFontSourceMetadata {
	readonly upm: number;
}
export interface GlyphRelation<GID> {
	readonly target: GID;
	readonly relationTag: string;
}
export interface IFontSource<GID, VAR, MASTER> {
	readonly format: string;

	readonly metadata: IFontSourceMetadata;

	getGlyphFromName(name: string): GID | undefined;
	getUniqueGlyphName(glyph: GID): string;
	getCharacterSet(): Set<number>;
	getGlyphSet(): Set<GID>;
	getEncodedGlyph(codePoint: number): GID | null | undefined; // Get a glyph ID from a font
	getRelatedGlyphs(from: GID): GlyphRelation<GID>[] | null | undefined; // Get related glyphs
	getComponentGlyphs(from: GID): GlyphRelation<GID>[] | null | undefined; // Get components

	getGlyphMasters(glyph: GID): { peak: VAR; master: MASTER }[]; // Get master list
	getGeometry(glyph: GID, instance: null | VAR): GlyphGeometry; // Get geometry

	createHintStore(): IHintStore;
}
export interface IHintStore {
	listGlyphs(): Iterable<string>;
	getGlyphHints(glyph: string): IHint | null | undefined;
	setGlyphHints(glyph: string, hint: IHint): void;
	listSharedTypes(): Iterable<string>;
	getSharedHints(type: string): IHint | null | undefined;
	setSharedHints(type: string, hint: IHint): void;
}

export interface IFinalHintFactory {
	createFinalHintCollectorFor(to: IHintStore): IFinalHintCollector;
	createFinalHintIntegratorFor(from: IHintStore, to: any): IFinalSinkIntegrator;
}
export interface IFinalHintProgramSink {
	readonly format: string;
	save(): void;
}
export interface IFinalHintSession {
	readonly format: string;
	createGlyphProgramSink(gid: string): IFinalHintProgramSink;
	createSharedProgramSink(type: string): IFinalHintProgramSink;
}
export interface IFinalHintCollector {
	readonly format: string;
	createSession(): IFinalHintSession;
}
export interface IFinalSinkIntegrator {
	readonly format: string;
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

// Shape analysis
export interface IHintingModelFactory {
	readonly type: string;
	adopt<GID, VAR, MASTER>(
		font: IFontSource<GID, VAR, MASTER>,
		parameters: any
	): IHintingModel<GID> | null | undefined;
}
export interface HintingModelConfig {
	readonly type: string;
	readonly parameters?: any;
}
export interface IHintingModel<GID> {
	readonly type: string;
	// Analyze shared parameters (usually CVT)
	// Return the glyphs needed to be hinted
	analyzeSharedParameters(): null | Set<GID>;
	// Create glyph analyzer
	analyzeGlyph(gid: GID): IHint;
	// Create a compiler to compile shared functions / parameters
	getSharedHints(): IHint;
}
