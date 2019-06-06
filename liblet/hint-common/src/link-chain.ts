import { IFinalHintProgramSink, IHint, IHintCompiler, IHintFactory } from "@chlorophytum/arch";
import { HlttProgramSink } from "@chlorophytum/sink-hltt";

export namespace LinkChain {
	const TAG = "Chlorophytum::CommonHints::LinkChain";
	export class Hint implements IHint {
		constructor(private readonly pts: number[]) {}
		toJSON() {
			return {
				type: TAG,
				pts: this.pts
			};
		}
		createCompiler(sink: IFinalHintProgramSink): IHintCompiler | null {
			if (sink instanceof HlttProgramSink) {
				return new HlttCompiler(sink, this.pts);
			}
			return null;
		}
	}

	export class HintFactory implements IHintFactory {
		readonly type = TAG;
		readJson(json: any) {
			if (json && json.type === TAG) {
				return new Hint(json.pts);
			}
			return null;
		}
	}

	export class HlttCompiler implements IHintCompiler {
		constructor(private readonly sink: HlttProgramSink, private readonly pts: number[]) {}
		doCompile() {
			const hc = this;
			this.sink.addSegment(function*($) {
				for (let j = 1; j < hc.pts.length; j++) {
					yield $.mdrp(hc.pts[j - 1], hc.pts[j]);
				}
			});
		}
	}
}
