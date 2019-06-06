import { IFinalHintProgramSink, IHint, IHintCompiler, IHintFactory } from "@chlorophytum/arch";
import { HlttProgramSink } from "@chlorophytum/sink-hltt";

export namespace Interpolate {
	const TAG = "Chlorophytum::CommonHints::Interpolate";
	export class Hint implements IHint {
		constructor(
			private readonly rp1: number,
			private readonly rp2: number,
			private readonly pts: number[]
		) {}
		toJSON() {
			return {
				type: TAG,
				rp1: this.rp1,
				rp2: this.rp2,
				pts: this.pts
			};
		}
		createCompiler(sink: IFinalHintProgramSink): IHintCompiler | null {
			if (sink instanceof HlttProgramSink) {
				return new HlttCompiler(sink, this.rp1, this.rp2, this.pts);
			}
			return null;
		}
	}

	export class HintFactory implements IHintFactory {
		readonly type = TAG;
		readJson(json: any) {
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
		doCompile() {
			const hc = this;
			this.sink.addSegment($ => [$.ip(hc.rp1, hc.rp2, ...hc.pts)]);
		}
	}
}
