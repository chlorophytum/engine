import { Compilation } from "./compilation";
import { GlyphGeometry, HPoint, IGlyphPoint, ReadonlyHPoint } from "./geometry";
import { GlyphMeta } from "./meta";

// Mounted hints are specific to the geometry -- hint spots can acquire actual point coordinates.
// TT compilation works at this level too, although it is (somehow) coordinate independent.
export namespace Mounted {
	export interface Spot {
		zPrimary: HPoint; // point index of primary side
		zOpposite: HPoint; // point index of opposite side.
		// If zPrimary === zOpposite, then this "spot" is monolateral
	}
	export interface ReadonlySpot {
		zPrimary: ReadonlyHPoint;
		zOpposite: ReadonlyHPoint;
	}
	export interface SpotSet {
		[key: string]: Spot;
	}

	export interface Feature<P> {
		readonly dependents: ReadonlyArray<ReadonlySpot>;
		readonly affects: ReadonlyArray<Spot>;
		computeHintedPosition(upm: number, ppem: number, params: P): void;
		createCompiler<H, C>(
			format: Compilation.Format<H, C>
		): Compilation.FeatureCompiler<H, C, P> | null | undefined;
	}
	export interface Hints<P> {
		spots: SpotSet;
		relations: Array<Feature<P>>;
	}
}

// Unmounted hints are independent to the geometry -- we only record references to the geometry
// parts (points). Mounting would convert unmounted features into mounted features.
// If we export hints into JSON, it would be stored in unmounted form.
export namespace Unmounted {
	export interface Spot {
		cPrimary: number;
		jPrimary: number;
		cOpposite: number;
		jOpposite: number;

		// Positional
		zPrimary?: IGlyphPoint;
		zOpposite?: IGlyphPoint;
	}
	export interface SpotSet {
		[key: string]: Spot;
	}
	export interface Feature {
		readonly type: string;
		readonly dependents: ReadonlyArray<string>;
		readonly affects: ReadonlyArray<string>;
		readonly parameters?: any; // additional parameters
	}

	export interface Hints {
		spots: SpotSet;
		relations: Array<Feature>;
	}
}

export namespace Analyze {
	export interface GlyphAnalyzer<P> {
		analyzeGlyph(paramSink: P, meta: GlyphMeta, geom: GlyphGeometry): void;
	}
}

export interface HintingModel<P> {
	readonly id: string;
	readonly requiredKeywords: ReadonlySet<string>;
	readonly preferredKeywords: ReadonlySet<string>;

	createParameters(): P;
	readonly featureMounters: {
		readonly [key: string]: HintingModel.FeatureMounter<P> | undefined;
	};
}

export namespace HintingModel {
	export interface FeatureMounter<P> {
		mountFeature(
			geometry: GlyphGeometry,
			spots: Unmounted.SpotSet,
			feature: Unmounted.Feature
		): null | undefined | Mounted.Feature<P>;
	}
}
