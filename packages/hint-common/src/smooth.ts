import {
	IFinalHintProgramSink,
	IHint,
	IHintCompiler,
	IHintFactory,
	PropertyBag
} from "@chlorophytum/arch";
import { HlttProgramSink } from "@chlorophytum/final-hint-format-hltt";

export namespace Smooth {
	const TAG = "Chlorophytum::CommonHints::Smooth";
	export class Hint implements IHint {
		constructor() {}
		public toJSON() {
			return { type: TAG };
		}
		public createCompiler(bag: PropertyBag, sink: IFinalHintProgramSink): IHintCompiler | null {
			const hlttSink = sink.dynamicCast(HlttProgramSink);
			if (hlttSink) return new HlttCompiler(hlttSink);
			return null;
		}
		public traverse() {}
	}

	export class HintFactory implements IHintFactory {
		public readonly type = TAG;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		public readJson(json: any) {
			if (json && json.type === TAG) {
				return new Hint();
			}
			return null;
		}
	}

	export class HlttCompiler implements IHintCompiler {
		constructor(private readonly sink: HlttProgramSink) {}
		public doCompile() {
			this.sink.addSegment(function* ($) {
				yield $.iup.x();
				yield $.iup.y();
			});
		}
	}
}
