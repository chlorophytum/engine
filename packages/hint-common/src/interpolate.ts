import {
	Geometry,
	IFinalHintProgramSink,
	IHint,
	IHintCompiler,
	IHintFactory,
	PropertyBag
} from "@chlorophytum/arch";
import { HlttProgramSink } from "@chlorophytum/final-hint-format-hltt";
import { Ip } from "@chlorophytum/hltt-next";

export namespace Interpolate {
	const TAG = "Chlorophytum::CommonHints::Interpolate";
	export class Hint implements IHint {
		constructor(
			private readonly rp1: Geometry.PointReference,
			private readonly rp2: Geometry.PointReference,
			private readonly pts: Geometry.PointReference[]
		) {}
		public toJSON() {
			return {
				type: TAG,
				rp1: this.rp1,
				rp2: this.rp2,
				pts: this.pts
			};
		}
		public createCompiler(bag: PropertyBag, sink: IFinalHintProgramSink): IHintCompiler | null {
			const hlttSink = sink.dynamicCast(HlttProgramSink);
			if (hlttSink) return new HlttCompiler(hlttSink, this.rp1, this.rp2, this.pts);

			return null;
		}
		public traverse() {}
	}

	export class HintFactory implements IHintFactory {
		public readonly type = TAG;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		public readJson(json: any) {
			if (json && json.type === TAG) {
				return new Hint(json.rp1, json.rp2, json.pts);
			}
			return null;
		}
	}

	class HlttCompiler implements IHintCompiler {
		constructor(
			private readonly sink: HlttProgramSink,
			private readonly rp1: Geometry.PointReference,
			private readonly rp2: Geometry.PointReference,
			private readonly pts: Geometry.PointReference[]
		) {}
		public doCompile() {
			// eslint-disable-next-line @typescript-eslint/no-this-alias
			const hc = this;
			this.sink.addSegment($ => [
				Ip(
					this.sink.resolveGlyphPoint(hc.rp1),
					this.sink.resolveGlyphPoint(hc.rp2),
					hc.pts.map(pt => this.sink.resolveGlyphPoint(pt))
				)
			]);
		}
	}
}
