import { Compilation } from "./compilation";
import { GlyphGeometry, InstanceTuple } from "./geometry";
import { GlyphMeta } from "./meta";

export namespace Font {
	export interface Support {
		getGlyphSource(): GlyphSource | null | undefined;
		getCompilationSupport<H, C>(
			format: Compilation.Format<H, C>
		): Compilation.Support<H, C> | null | undefined;
	}

	export interface GlyphSource {
		getGlyphs(): ReadonlyArray<GeometrySource>;
	}

	export interface GeometrySource {
		readonly identifier: string;
		readonly geometryHash: string;
		readonly meta: GlyphMeta;
		getGeometry(instance?: null | undefined | InstanceTuple): GlyphGeometry;
	}
}
