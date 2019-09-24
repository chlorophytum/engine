import {
	IFinalHintProgramSink,
	IHint,
	IHintCompiler,
	IHintFactory,
	PropertyBag
} from "@chlorophytum/arch";
import { HlttProgramSink } from "@chlorophytum/final-hint-format-hltt";

export namespace LinkChain {
	const TAG = "Chlorophytum::CommonHints::LinkChain";
	export class Hint implements IHint {
		constructor(private readonly pts: number[]) {}
		public toJSON() {
			return {
				type: TAG,
				pts: this.pts
			};
		}
		public createCompiler(bag: PropertyBag, sink: IFinalHintProgramSink): IHintCompiler | null {
			if (sink instanceof HlttProgramSink) {
				return new HlttCompiler(sink, this.pts);
			}
			return null;
		}
		public traverse() {}
	}

	export class HintFactory implements IHintFactory {
		public readonly type = TAG;
		public readJson(json: any) {
			if (json && json.type === TAG) {
				return new Hint(json.pts);
			}
			return null;
		}
	}

	export class HlttCompiler implements IHintCompiler {
		constructor(private readonly sink: HlttProgramSink, private readonly pts: number[]) {}
		public doCompile() {
			const hc = this;
			this.sink.addSegment(function*($) {
				for (let j = 1; j < hc.pts.length; j++) {
					yield $.mdrp(hc.pts[j - 1], hc.pts[j]);
				}
			});
		}
	}
}
