import { IFinalHintProgramSink, IHint, IHintCompiler, IHintFactory } from "@chlorophytum/arch";
import { HlttProgramSink } from "@chlorophytum/sink-hltt";

import { PREFIX } from "./constants";
import { TInitEmBoxTwilightPoints } from "./programs";

export namespace EmBoxInit {
	const TAG = "Chlorophytum::EmBox::Init";
	export class Hint implements IHint {
		constructor(private readonly name: string) {}
		toJSON() {
			return { type: TAG, name: this.name };
		}
		createCompiler(sink: IFinalHintProgramSink): IHintCompiler | null {
			if (sink instanceof HlttProgramSink) {
				return new HlttCompiler(sink, this.name);
			}
			return null;
		}
	}

	export class HintFactory implements IHintFactory {
		readonly type = TAG;
		readJson(json: any) {
			if (json && json.type === TAG) return new Hint(json.name);
			return null;
		}
	}

	export class HlttCompiler implements IHintCompiler {
		constructor(private readonly sink: HlttProgramSink, private readonly name: string) {}
		doCompile() {
			const { name } = this;
			this.sink.addSegment(function*($) {
				const strokeBottom = $.globalTwilight(`${PREFIX}::${name}::StrokeBottom`);
				const strokeTop = $.globalTwilight(`${PREFIX}::${name}::StrokeTop`);
				const spurBottom = $.globalTwilight(`${PREFIX}::${name}::SpurBottom`);
				const spurTop = $.globalTwilight(`${PREFIX}::${name}::SpurTop`);

				yield $.call(
					TInitEmBoxTwilightPoints,
					strokeBottom,
					strokeTop,
					spurBottom,
					spurTop
				);
			});
		}
	}
}
