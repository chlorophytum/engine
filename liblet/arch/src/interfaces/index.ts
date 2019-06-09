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
export interface IFontSource<Glyph, VAR, MASTER> {
	readonly format: string;

	getGlyphFromName(name: string): Glyph | undefined;
	getUniqueGlyphName(glyph: Glyph): string;
	getCharacterSet(): Set<number>;
	getGlyphSet(): Set<Glyph>;
	getEncodedGlyph(codePoint: number): Glyph | null | undefined; // Get a glyph ID from a font
	getRelatedGlyphs(from: Glyph): Glyph[] | null | undefined; // Get related glyphs
	getComponentGlyphs(from: Glyph): Glyph[] | null | undefined; // Get components

	getGlyphMasters(glyph: Glyph): { peak: VAR; master: MASTER }[]; // Get master list
	getGeometry(glyph: Glyph, instance: null | VAR): GlyphGeometry; // Get geometry

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
	adopt<GID, VAR, MASTER>(
		font: IFontSource<GID, VAR, MASTER>
	): IHintingModel<GID> | null | undefined;
}
export interface IHintingModel<GID> {
	readonly type: string;
	// Analyze shared parameters (usually CVT)
	analyzeSharedParameters(): null | Set<GID>;
	// Create glyph analyzer
	analyzeGlyph(gid: GID): IHint;
	// Create a compiler to compile shared functions / parameters
	getSharedHints(): IHint;
}
