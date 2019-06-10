import { IFinalHintProgramSink, IHint, IHintCompiler, IHintFactory } from "@chlorophytum/arch";
import { TranslateEmboxTwilightName } from "@chlorophytum/hint-embox";
import { HlttProgramSink } from "@chlorophytum/sink-hltt";
import * as _ from "lodash";

import { THintMultipleStrokesExplicit, THintMultipleStrokesStub } from "./hltt-programs";
import { getRecPath, MultipleAlignZoneProps } from "./props";

export namespace MultipleAlignZone {
	const TAG = "Chlorophytum::MultipleAlignZone::MultipleAlignZone";
	export class Hint implements IHint {
		private readonly N: number;
		private readonly props: MultipleAlignZoneProps;
		constructor(props: MultipleAlignZoneProps) {
			const N = props.middleStrokes.length;
			this.N = N;

			if (props.mergePriority.length !== N + 1) {
				throw new TypeError("mergePriority length mismatch");
			}
			if (props.gapMinDist.length !== N + 1) {
				throw new TypeError("gapMinDist length mismatch");
			}
			if (props.inkMinDist.length !== N) {
				throw new TypeError("inkMinDist length mismatch");
			}
			this.props = {
				...props,
				recPath: getRecPath(props.mergePriority, N)
			};
		}
		toJSON() {
			return { type: TAG, props: this.props };
		}
		createCompiler(sink: IFinalHintProgramSink): IHintCompiler | null {
			if (sink instanceof HlttProgramSink) {
				return new HlttCompiler(sink, this.props);
			}
			return null;
		}
	}

	export class HintFactory implements IHintFactory {
		readonly type = TAG;
		readJson(json: any) {
			if (json && json.type === TAG) return new Hint(json.props);
			return null;
		}
	}
	export class HlttCompiler implements IHintCompiler {
		constructor(
			private readonly sink: HlttProgramSink,
			private readonly props: MultipleAlignZoneProps
		) {}
		doCompile() {
			const { props } = this;
			const N = props.middleStrokes.length;
			this.sink.addSegment(function*($) {
				const strokeBottom = $.globalTwilight(
					TranslateEmboxTwilightName(props.emBoxName, "StrokeBottom")
				);
				const strokeTop = $.globalTwilight(
					TranslateEmboxTwilightName(props.emBoxName, "StrokeTop")
				);

				const bottomPoint = props.bottomPoint < 0 ? strokeBottom : props.bottomPoint;
				const topPoint = props.topPoint < 0 ? strokeTop : props.topPoint;

				if (N <= 4) {
					yield $.call(
						THintMultipleStrokesStub(N, props),
						bottomPoint,
						topPoint,
						..._.flatten(props.middleStrokes)
					);
				} else {
					yield $.call(
						THintMultipleStrokesExplicit(N),
						...props.gapMinDist,
						...props.inkMinDist,
						...props.recPath,
						props.bottomFree ? 2 : 1,
						props.topFree ? 2 : 1,
						bottomPoint,
						topPoint,
						..._.flatten(props.middleStrokes)
					);
				}
			});
		}
	}
}
