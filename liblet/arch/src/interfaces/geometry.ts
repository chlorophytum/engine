import { Variation } from "./variation";

export namespace Geometry {
	export type Point = {
		readonly x: number;
		readonly y: number;
	};
	export type GlyphPoint = {
		readonly x: number;
		readonly y: number;
		readonly on: boolean;
		readonly references: null | PointReference[];
	};
	export type PointReference = { readonly kind: string; readonly id: number };
	export type PointRefKind = { readonly kind: string } & ((x: number) => PointReference);
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

	export interface Metric {
		readonly hStart: number;
		readonly hEnd: number;
		readonly vStart: number;
		readonly vEnd: number;
	}
}
