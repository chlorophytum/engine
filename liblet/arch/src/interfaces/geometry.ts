import { Variation } from "./variation";

export namespace Geometry {
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
}

export namespace Glyph {
	export type Geom = readonly Geometry.GlyphPoint[][];
	export interface ShapeComponent {
		readonly shape: Shape; // Shape of resulting geometry, transformed
	}
	export interface Shape {
		readonly eigen: Geom;
		readonly compositionOperator?: string;
		readonly components?: ShapeComponent;
	}
	export interface Relation<G> {
		readonly target: G;
		readonly relationTag: string;
	}

	export interface Rep {
		readonly shapes: Variation.Variance<Shape>;
	}
}
