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
			if (N <= 4) {
				// For small N, use templates
				this.sink.addSegment($ => [
					$.call(
						THintMultipleStrokesStub(N, props),
						props.bottomPoint,
						props.topPoint,
						..._.flatten(props.middleStrokes)
					)
				]);
			} else {
				// Otherwise, go the "explicit" path and pass all the args in
				this.sink.addSegment($ => [
					$.call(
						THintMultipleStrokesExplicit(N),
						...props.gapMinDist,
						...props.inkMinDist,
						...props.recPath,
						props.bottomFree ? 2 : 1,
						props.topFree ? 2 : 1,
						props.bottomPoint,
						props.topPoint,
						..._.flatten(props.middleStrokes)
					)
				]);
			}
		}
	}
}

export namespace EmBoxFreeStroke {
	const TAG = "Chlorophytum::MultipleAlignZone::EmboxFreeStroke";
	export class Hint implements IHint {
		constructor(
			private readonly boxName: string,
			private readonly bottom: number,
			private readonly top: number
		) {}
		toJSON() {
			return { type: TAG, boxName: this.boxName, bottom: this.bottom, top: this.top };
		}
		createCompiler(sink: IFinalHintProgramSink): IHintCompiler | null {
			if (sink instanceof HlttProgramSink) {
				return new HlttCompiler(sink, this.boxName, this.bottom, this.top);
			}
			return null;
		}
	}

	export class HintFactory implements IHintFactory {
		readonly type = TAG;
		readJson(json: any) {
			if (json && json.type === TAG) return new Hint(json.boxName, json.bottom, json.top);
			return null;
		}
	}
	export class HlttCompiler implements IHintCompiler {
		constructor(
			private readonly sink: HlttProgramSink,
			private readonly boxName: string,
			private readonly bottom: number,
			private readonly top: number
		) {}
		doCompile() {
			const { boxName, bottom, top } = this;

			this.sink.addSegment(function*($) {
				const strokeBottom = $.globalTwilight(
					TranslateEmboxTwilightName(boxName, "SpurBottom")
				);
				const strokeTop = $.globalTwilight(TranslateEmboxTwilightName(boxName, "SpurTop"));
				yield $.call(
					THintMultipleStrokesStub(1, {
						gapMinDist: [1, 1],
						inkMinDist: [1],
						recPath: [0],
						bottomFree: false,
						topFree: false
					}),
					strokeBottom,
					strokeTop,
					bottom,
					top
				);
			});
		}
	}
}
