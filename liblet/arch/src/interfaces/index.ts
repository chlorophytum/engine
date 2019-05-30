export interface GlyphPoint {
	readonly x: number;
	readonly y: number;
	readonly on: boolean;
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
	createFinalHintSinkFor(to: IHintStore): IFinalHintSink;
	createFinalHintIntegratorFor(from: IHintStore, to: any): IFinalSinkIntegrator;
}
export interface IFinalHintSink {
	readonly format: string;
	save(to: string): Promise<void>;
}
export interface IFinalSinkIntegrator {
	readonly format: string;
	integrate(): Promise<void>;
}

// Visual hints are geometry-invariant
export interface IHint {
	toJSON(): any;
	createCompiler(font: IFinalHintSink): IHintCompiler | null | undefined;
}
export interface IHintFactory {
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
