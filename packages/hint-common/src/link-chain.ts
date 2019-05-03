import {
	Geometry,
	IFinalHintProgramSink,
	IHint,
	IHintCompiler,
	IHintFactory,
	PropertyBag
} from "@chlorophytum/arch";
import { HlttProgramSink } from "@chlorophytum/final-hint-format-hltt";
import { Mdrp } from "@chlorophytum/hltt-next-stmt";

export namespace LinkChain {
	const TAG = "Chlorophytum::CommonHints::LinkChain";
	export class Hint implements IHint {
		constructor(private readonly pts: Geometry.PointReference[]) {}
		public toJSON() {
			return {
				type: TAG,
				pts: this.pts
			};
		}
		public createCompiler(bag: PropertyBag, sink: IFinalHintProgramSink): IHintCompiler | null {
			const hlttSink = sink.dynamicCast(HlttProgramSink);
			if (hlttSink) return new HlttCompiler(hlttSink, this.pts);

			return null;
		}
		public traverse() {}
	}

	export class HintFactory implements IHintFactory {
		public readonly type = TAG;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		public readJson(json: any) {
			if (json && json.type === TAG) {
				return new Hint(json.pts);
			}
			return null;
		}
	}

	export class HlttCompiler implements IHintCompiler {
		constructor(
			private readonly sink: HlttProgramSink,
			private readonly pts: Geometry.PointReference[]
		) {}
		public doCompile() {
			const ptIndex = this.pts.map(pt => this.sink.resolveGlyphPoint(pt));
			// eslint-disable-next-line @typescript-eslint/no-this-alias
			const hc = this;
			this.sink.addSegment(function* ($) {
				for (let j = 1; j < hc.pts.length; j++) {
					yield Mdrp.rp0(ptIndex[j - 1], ptIndex[j]);
				}
			});
		}
	}
}
