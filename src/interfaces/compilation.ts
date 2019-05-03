import { GlyphGeometry } from "./geometry";

export namespace Compilation {
	export interface Format<H, C> {
		readonly id: string;
	}
	export interface FeatureCompiler<H, C, P> {
		compile(params: P, context: C, refGeom: GlyphGeometry): H;
	}
	export interface Support<H, C> {
		createContextFromFont(): C;
		setHintToGlyph(identifier: string, hints: H): void;
		applyContextToFont(context: C): void;
	}
}
