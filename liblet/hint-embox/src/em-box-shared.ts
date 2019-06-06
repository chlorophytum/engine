import { IFinalHintProgramSink, IHint, IHintCompiler, IHintFactory } from "@chlorophytum/arch";
import { HlttProgramSink } from "@chlorophytum/sink-hltt";

import { PREFIX } from "./constants";

export namespace EmBoxShared {
	export interface EmBoxProps {
		name: string;
		strokeBottom: number;
		strokeTop: number;
		spurBottom: number;
		spurTop: number;
	}
	const TAG = "Chlorophytum::EmBox::Shared";
	export class Hint implements IHint {
		constructor(private readonly props: EmBoxProps) {}
		toJSON() {
			return {
				type: TAG,
				props: this.props
			};
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
			if (json && json.type === TAG) {
				return new Hint(json.props);
			}
			return null;
		}
	}

	export class HlttCompiler implements IHintCompiler {
		constructor(private readonly sink: HlttProgramSink, private readonly props: EmBoxProps) {}
		doCompile() {
			const props = this.props;
			this.sink.addSegment(function*($) {
				const strokeBottom = $.globalTwilight(`${PREFIX}::${props.name}::StrokeBottom`);
				const strokeTop = $.globalTwilight(`${PREFIX}::${props.name}::StrokeTop`);
				const spurBottom = $.globalTwilight(`${PREFIX}::${props.name}::SpurBottom`);
				const spurTop = $.globalTwilight(`${PREFIX}::${props.name}::SpurTop`);

				yield $.svtca.y();
				yield $.scfs(
					strokeBottom,
					$.div(
						$.mul($.coerce.toF26D6(props.strokeBottom * 64), $.toFloat($.mppem())),
						$.coerce.toF26D6(64)
					)
				);
				yield $.scfs(
					strokeTop,
					$.div(
						$.mul($.coerce.toF26D6(props.strokeTop * 64), $.toFloat($.mppem())),
						$.coerce.toF26D6(64)
					)
				);
				yield $.scfs(
					spurBottom,
					$.div(
						$.mul($.coerce.toF26D6(props.spurBottom * 64), $.toFloat($.mppem())),
						$.coerce.toF26D6(64)
					)
				);
				yield $.scfs(
					spurTop,
					$.div(
						$.mul($.coerce.toF26D6(props.spurTop * 64), $.toFloat($.mppem())),
						$.coerce.toF26D6(64)
					)
				);
			});
		}
	}
}
