export interface GlyphPoint {
	x: number;
	y: number;
	on: boolean;
}
export type GlyphGeometry = GlyphPoint[][];

export interface IFont<GID, VAR, MASTER> {
	getEncodedGlyph(codePoint: number): GID | null | undefined; // Get a glyph ID from a font
	getRelatedGlyphs(from: GID): GID[] | null | undefined; // Get related glyphs
	getComponentGlyphs(from: GID): GID[] | null | undefined; // Get dependent glyphs, usually components

	getGlyphMasters(glyph: GID): MASTER[]; // Get master list
	getGeometry(glyph: GID, instance: null | VAR): GlyphGeometry; // Get geometry
}

// Script analysis
export interface IScriptAnalyzer {
	getScript(codePoint: number): string;
}

// Visual hints are geometry-invariant
export interface IHint {
	toJSON(): any;
	createCompiler<FONT>(font: FONT): IHintCompiler | null | undefined;
}
export interface IHintFactory {
	readJson(json: any): IHint | null | undefined;
}
export interface IHintCompiler {
	doCompile(): void;
}

// Shape analysis
export interface IHintingModel<VAR, MASTER> {
	analyzeSharedParameters(
		instance: VAR | null,
		master: MASTER | null,
		glyphs: Map<string, GlyphGeometry>
	): void;
	createGlyphAnalyzer(): IGlyphShapeAnalyzer<VAR, MASTER>;
}

export interface IGlyphShapeAnalyzer<VAR, MASTER> {
	analyzeTopology(geometry: GlyphGeometry): void;
	analyzeVariant(instance: VAR, master: MASTER, geometry: GlyphGeometry): void;
	getHints(): IHint[];
}
