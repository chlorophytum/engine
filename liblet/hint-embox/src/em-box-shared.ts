import { IFinalHintProgramSink, IHint, IHintCompiler, IHintFactory } from "@chlorophytum/arch";
import { HlttProgramSink } from "@chlorophytum/final-hint-format-hltt";

import { getEmBoxPoints } from "./constants";
import { TInitEmBoxPointPrep } from "./programs/index";

export namespace EmBoxShared {
	export interface EmBoxProps {
		name: string;
		strokeBottom: number;
		strokeTop: number;
		archBottom: number;
		archTop: number;
		spurBottom: number;
		spurTop: number;
	}
	const TAG = "Chlorophytum::EmBox::Shared";
	export class Hint implements IHint {
		constructor(private readonly props: EmBoxProps) {}
		public toJSON() {
			return {
				type: TAG,
				props: this.props
			};
		}
		public createCompiler(sink: IFinalHintProgramSink): IHintCompiler | null {
			if (sink instanceof HlttProgramSink) {
				return new HlttCompiler(sink, this.props);
			}
			return null;
		}
	}

	export class HintFactory implements IHintFactory {
		public readonly type = TAG;
		public readJson(json: any) {
			if (json && json.type === TAG) {
				return new Hint(json.props);
			}
			return null;
		}
	}

	export class HlttCompiler implements IHintCompiler {
		constructor(private readonly sink: HlttProgramSink, private readonly props: EmBoxProps) {}
		public doCompile() {
			const props = this.props;
			this.sink.addSegment(function*($) {
				const pts = getEmBoxPoints($, props.name);

				yield $.svtca.y();
				yield TInitEmBoxPointPrep($, pts.strokeBottom, props.strokeBottom);
				yield TInitEmBoxPointPrep($, pts.strokeTop, props.strokeTop);
				yield TInitEmBoxPointPrep($, pts.archBottom, props.archBottom);
				yield TInitEmBoxPointPrep($, pts.archTop, props.archTop);
				yield TInitEmBoxPointPrep($, pts.spurBottom, props.spurBottom);
				yield TInitEmBoxPointPrep($, pts.spurTop, props.spurTop);
			});
		}
	}
}
