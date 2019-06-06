import { IFinalHintProgramSink, IHint, IHintCompiler, IHintFactory } from "@chlorophytum/arch";
import { HlttProgramSink } from "@chlorophytum/sink-hltt";

import { PREFIX } from "./constants";
import {
	THintBottomStroke,
	THintBottomStrokeFree,
	THintTopStroke,
	THintTopStrokeFree
} from "./programs";

export namespace EmBoxStroke {
	const TAG = "Chlorophytum::EmBox::Stroke";
	export class Hint implements IHint {
		constructor(
			private readonly boxName: string,
			private readonly top: boolean,
			private readonly spur: boolean,
			private readonly zSBot: number,
			private readonly zsTop: number
		) {}
		toJSON() {
			return {
				type: TAG,
				boxName: this.boxName,
				top: this.top,
				spur: this.spur,
				zsBot: this.zSBot,
				zsTop: this.zsTop
			};
		}
		createCompiler(sink: IFinalHintProgramSink): IHintCompiler | null {
			if (sink instanceof HlttProgramSink) {
				return new HlttCompiler(
					sink,
					this.boxName,
					this.top,
					this.spur,
					this.zSBot,
					this.zsTop
				);
			}
			return null;
		}
	}

	export class HintFactory implements IHintFactory {
		readonly type = TAG;
		readJson(json: any) {
			if (json && json.type === TAG) {
				return new Hint(json.boxName, json.top, json.spur, json.zsBot, json.zsTop);
			}
			return null;
		}
	}

	export class HlttCompiler implements IHintCompiler {
		constructor(
			private readonly sink: HlttProgramSink,
			private readonly boxName: string,
			private readonly top: boolean,
			private readonly spur: boolean,
			private readonly zsBot: number,
			private readonly zsTop: number
		) {}
		doCompile() {
			const { boxName, top, spur, zsBot, zsTop } = this;
			this.sink.addSegment(function*($) {
				const strokeBottom = $.globalTwilight(`${PREFIX}::${boxName}::StrokeBottom`);
				const strokeTop = $.globalTwilight(`${PREFIX}::${boxName}::StrokeTop`);
				const spurBottom = $.globalTwilight(`${PREFIX}::${boxName}::SpurBottom`);
				const spurTop = $.globalTwilight(`${PREFIX}::${boxName}::SpurTop`);

				if (spur) {
					if (top) yield $.call(THintTopStroke, spurBottom, spurTop, zsBot, zsTop);
					else yield $.call(THintBottomStroke, spurBottom, spurTop, zsBot, zsTop);
				} else {
					if (top) {
						yield $.call(THintTopStrokeFree, spurBottom, spurTop, zsBot, zsTop);
					} else {
						yield $.call(THintBottomStrokeFree, spurBottom, spurTop, zsBot, zsTop);
					}
				}
			});
		}
	}
}
