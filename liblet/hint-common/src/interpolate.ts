import {
	IFinalHintProgramSink,
	IHint,
	IHintCompiler,
	IHintFactory,
	PropertyBag
} from "@chlorophytum/arch";
import { HlttProgramSink } from "@chlorophytum/final-hint-format-hltt";

export namespace Interpolate {
	const TAG = "Chlorophytum::CommonHints::Interpolate";
	export class Hint implements IHint {
		constructor(
			private readonly rp1: number,
			private readonly rp2: number,
			private readonly pts: number[]
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
			private readonly rp1: number,
			private readonly rp2: number,
			private readonly pts: number[]
		) {}
		public doCompile() {
			const hc = this;
			this.sink.addSegment($ => [$.ip(hc.rp1, hc.rp2, ...hc.pts)]);
		}
	}
}
