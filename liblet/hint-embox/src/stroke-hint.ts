import { IFinalHintProgramSink, IHint, IHintCompiler, IHintFactory } from "@chlorophytum/arch";
import { HlttProgramSink } from "@chlorophytum/sink-hltt";

import { getEmBoxPoints } from "./constants";
import {
	DefaultStretch,
	StretchProps,
	THintBottomStroke,
	THintStrokeFreeAuto,
	THintTopStroke
} from "./programs";

export namespace EmBoxStroke {
	const TAG = "Chlorophytum::EmBox::Stroke";
	export type Stretch = StretchProps;
	export class Hint implements IHint {
		constructor(
			private readonly boxName: string,
			private readonly top: boolean,
			private readonly spur: boolean,
			private readonly zSBot: number,
			private readonly zsTop: number,
			private readonly stretch: StretchProps | null = null
		) {}
		public toJSON() {
			return {
				type: TAG,
				boxName: this.boxName,
				top: this.top,
				spur: this.spur,
				zsBot: this.zSBot,
				zsTop: this.zsTop,
				stretch: this.stretch
			};
		}
		public createCompiler(sink: IFinalHintProgramSink): IHintCompiler | null {
			if (sink instanceof HlttProgramSink) {
				return new HlttCompiler(
					sink,
					this.boxName,
					this.top,
					this.spur,
					this.zSBot,
					this.zsTop,
					this.stretch
				);
			}
			return null;
		}
	}

	export class HintFactory implements IHintFactory {
		public readonly type = TAG;
		public readJson(json: any) {
			if (json && json.type === TAG) {
				return new Hint(
					json.boxName,
					json.top,
					json.spur,
					json.zsBot,
					json.zsTop,
					json.stretch || null
				);
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
			private readonly zsTop: number,
			private readonly stretch: StretchProps | null
		) {}
		public doCompile() {
			const { boxName, top, spur, zsBot, zsTop, stretch } = this;
			this.sink.addSegment(function*($) {
				const {
					strokeBottom,
					strokeTop,
					archBottom,
					archTop,
					spurBottom,
					spurTop
				} = getEmBoxPoints($, boxName);

				if (spur) {
					if (top) {
						yield $.call(THintStrokeFreeAuto, spurBottom, spurTop, zsBot, zsTop);
					} else {
						yield $.call(THintStrokeFreeAuto, spurBottom, spurTop, zsBot, zsTop);
					}
				} else {
					if (top) {
						yield $.call(
							THintTopStroke(stretch || DefaultStretch),
							strokeBottom,
							strokeTop,
							archBottom,
							archTop,
							zsBot,
							zsTop
						);
					} else {
						yield $.call(
							THintBottomStroke(stretch || DefaultStretch),
							strokeBottom,
							strokeTop,
							archBottom,
							archTop,
							zsBot,
							zsTop
						);
					}
				}
			});
		}
	}
}
