import { IFinalHintProgramSink, IHint, IHintCompiler, IHintFactory } from "@chlorophytum/arch";
import { HlttProgramSink } from "@chlorophytum/sink-hltt";

import { PREFIX } from "./constants";
import { THintBottomEdge, THintTopEdge } from "./programs";

export namespace EmBoxEdge {
	const TAG = "Chlorophytum::EmBox::Edge";
	export class Hint implements IHint {
		constructor(
			private readonly boxName: string,
			private readonly top: boolean,
			private readonly zEdge: number
		) {}
		toJSON() {
			return {
				type: TAG,
				boxName: this.boxName,
				top: this.top,
				zEdge: this.zEdge
			};
		}
		createCompiler(sink: IFinalHintProgramSink): IHintCompiler | null {
			if (sink instanceof HlttProgramSink) {
				return new HlttCompiler(sink, this.boxName, this.top, this.zEdge);
			}
			return null;
		}
	}

	export class HintFactory implements IHintFactory {
		readonly type = TAG;
		readJson(json: any) {
			if (json && json.type === TAG) {
				return new Hint(json.boxName, json.top, json.zEdge);
			}
			return null;
		}
	}

	export class HlttCompiler implements IHintCompiler {
		constructor(
			private readonly sink: HlttProgramSink,
			private readonly boxName: string,
			private readonly top: boolean,
			private readonly zEdge: number
		) {}
		doCompile() {
			const { boxName, top, zEdge } = this;
			this.sink.addSegment(function*($) {
				const spurBottom = $.globalTwilight(`${PREFIX}::${boxName}::SpurBottom`);
				const spurTop = $.globalTwilight(`${PREFIX}::${boxName}::SpurTop`);

				if (top) yield $.call(THintTopEdge, spurBottom, spurTop, zEdge);
				else yield $.call(THintBottomEdge, spurBottom, spurTop, zEdge);
			});
		}
	}
}
