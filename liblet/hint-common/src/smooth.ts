import { IFinalHintProgramSink, IHint, IHintCompiler, IHintFactory } from "@chlorophytum/arch";
import { HlttProgramSink } from "@chlorophytum/final-hint-format-hltt";

export namespace Smooth {
	const TAG = "Chlorophytum::CommonHints::Smooth";
	export class Hint implements IHint {
		constructor() {}
		toJSON() {
			return { type: TAG };
		}
		createCompiler(sink: IFinalHintProgramSink): IHintCompiler | null {
			if (sink instanceof HlttProgramSink) {
				return new HlttCompiler(sink);
			}
			return null;
		}
	}

	export class HintFactory implements IHintFactory {
		readonly type = TAG;
		readJson(json: any) {
			if (json && json.type === TAG) {
				return new Hint();
			}
			return null;
		}
	}

	export class HlttCompiler implements IHintCompiler {
		constructor(private readonly sink: HlttProgramSink) {}
		doCompile() {
			this.sink.addSegment(function*($) {
				yield $.iup.x();
				yield $.iup.y();
			});
		}
	}
}
