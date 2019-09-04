import { IFinalHintProgramSink, IHint, IHintCompiler, IHintFactory } from "@chlorophytum/arch";
import { HlttProgramSink } from "@chlorophytum/final-hint-format-hltt";

export namespace EmBoxInit {
	const TAG = "Chlorophytum::EmBox::Init";
	export class Hint implements IHint {
		constructor(private readonly name: string) {}
		public toJSON() {
			return { type: TAG, name: this.name };
		}
		public createCompiler(sink: IFinalHintProgramSink): IHintCompiler | null {
			if (sink instanceof HlttProgramSink) {
				return new HlttCompiler(sink, this.name);
			}
			return null;
		}
	}

	export class HintFactory implements IHintFactory {
		public readonly type = TAG;
		public readJson(json: any) {
			if (json && json.type === TAG) return new Hint(json.name);
			return null;
		}
	}

	export class HlttCompiler implements IHintCompiler {
		constructor(private readonly sink: HlttProgramSink, private readonly name: string) {}
		public doCompile() {
			// Currently don't initialize em-box within glyph -- maybe do that later
			/* 
			const { name } = this;
			this.sink.addSegment(function*($) {
				yield $.call(
					TInitEmBoxTwilightPoints,
					$.symbol(Twilights.StrokeBottom(name)),
					$.symbol(Twilights.StrokeTop(name)),
					$.symbol(Twilights.ArchBottom(name)),
					$.symbol(Twilights.ArchTop(name)),
					$.symbol(Twilights.SpurBottom(name)),
					$.symbol(Twilights.SpurTop(name))
				);
			});

			*/
		}
	}
}
