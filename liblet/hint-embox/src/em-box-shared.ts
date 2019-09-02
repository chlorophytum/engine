import { IFinalHintProgramSink, IHint, IHintCompiler, IHintFactory } from "@chlorophytum/arch";
import { HlttProgramSink } from "@chlorophytum/final-hint-format-hltt";

import { ControlValues, Twilights } from "./programs/twilight";

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
			this.sink.setDefaultControlValue(
				ControlValues.SpurBottom(props.name),
				props.spurBottom
			);
			this.sink.setDefaultControlValue(ControlValues.SpurTop(props.name), props.spurTop);
			this.sink.setDefaultControlValue(
				ControlValues.StrokeBottom(props.name),
				props.strokeBottom
			);
			this.sink.setDefaultControlValue(ControlValues.StrokeTop(props.name), props.strokeTop);
			this.sink.setDefaultControlValue(
				ControlValues.ArchBottom(props.name),
				props.archBottom
			);
			this.sink.setDefaultControlValue(ControlValues.ArchTop(props.name), props.archTop);
			this.sink.addSegment(function*($) {
				yield $.miap(
					$.symbol(Twilights.StrokeBottom(props.name)),
					$.symbol(ControlValues.StrokeBottom(props.name)).ptr
				);
				yield $.miap(
					$.symbol(Twilights.StrokeTop(props.name)),
					$.symbol(ControlValues.StrokeTop(props.name)).ptr
				);
				yield $.miap(
					$.symbol(Twilights.ArchBottom(props.name)),
					$.symbol(ControlValues.ArchBottom(props.name)).ptr
				);
				yield $.miap(
					$.symbol(Twilights.ArchTop(props.name)),
					$.symbol(ControlValues.ArchTop(props.name)).ptr
				);
				yield $.miap(
					$.symbol(Twilights.SpurBottom(props.name)),
					$.symbol(ControlValues.SpurBottom(props.name)).ptr
				);
				yield $.miap(
					$.symbol(Twilights.SpurTop(props.name)),
					$.symbol(ControlValues.SpurTop(props.name)).ptr
				);
			});
		}
	}
}
