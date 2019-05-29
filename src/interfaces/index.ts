export interface GlyphPoint {
	readonly x: number;
	readonly y: number;
	readonly on: boolean;
}
export type GlyphGeometry = GlyphPoint[][];

export interface IFontSourceFactory {
	// "any"s are actually existential types
	createFontSourceFromFile(path: string): IFontSource<any, any, any>;
}
export interface IFontSource<GID, VAR, MASTER> {
	readonly format: string;
	getCharacterSet(): Set<number>;
	getGlyphSet(): Set<GID>;
	getEncodedGlyph(codePoint: number): GID | null | undefined; // Get a glyph ID from a font
	getRelatedGlyphs(from: GID): GID[] | null | undefined; // Get related glyphs
	getComponentGlyphs(from: GID): GID[] | null | undefined; // Get dependent glyphs, usually components

	getGlyphMasters(glyph: GID): { peak: VAR; master: MASTER }[]; // Get master list
	getGeometry(glyph: GID, instance: null | VAR): GlyphGeometry; // Get geometry

	createHintStore(): IHintStore<GID>;
}
export interface IHintStore<GID> {
	setGlyphHints(glyph: GID, hint: IHint[]): void;
	setSharedHints(type: string, hint: IHint[]): void;
}
export interface IFontSinkFactory {
	// "any"s are actually existential types
	createFontSinkFromFile(path: string): IFontSink;
}
export interface IFontSink {
	readonly format: string;
	save(to: string): void;
}

// Visual hints are geometry-invariant
export interface IHint {
	toJSON(): any;
	createCompiler<Sink>(font: Sink): IHintCompiler | null | undefined;
}
export interface IHintFactory {
	readJson(json: any): IHint | null | undefined;
}
export interface IHintCompiler {
	doCompile(): void;
}

// Shape analysis
export interface IHintingModelFactory {
	adopt<GID, VAR, MASTER>(
		font: IFontSource<GID, VAR, MASTER>
	): IHintingModel<GID, VAR, MASTER> | null | undefined;
}
export interface IHintingModel<GID, VAR, MASTER> {
	readonly type: string;
	// Analyze shared parameters (usually CVT)
	analyzeSharedParameters(font: IFontSource<GID, VAR, MASTER>): null | Set<GID>;
	// Create glyph analyzer
	createGlyphAnalyzer(): IGlyphShapeAnalyzer<VAR, MASTER>;
	// Create a compiler to compile shared functions / parameters
	getSharedHints(): IHint[];
}

export interface IGlyphShapeAnalyzer<VAR, MASTER> {
	analyzeTopology(geometry: GlyphGeometry): void;
	analyzeVariance(instance: VAR, master: MASTER, geometry: GlyphGeometry): void;
	getHints(): IHint[];
}
