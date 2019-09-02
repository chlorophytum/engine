import { IFinalHintProgramSink, IHint, IHintCompiler, IHintFactory } from "@chlorophytum/arch";
import { HlttProgramSink } from "@chlorophytum/final-hint-format-hltt";

export namespace WithDirection {
	const TAG = "Chlorophytum::CommonHints::WithDirection";
	export class Hint implements IHint {
		constructor(private readonly y: boolean, private readonly inner: IHint) {}
		public toJSON() {
			return { type: TAG, y: this.y, inner: this.inner.toJSON() };
		}
		public createCompiler(sink: IFinalHintProgramSink): IHintCompiler | null {
			const innerCompiler = this.inner.createCompiler(sink);
			if (!innerCompiler) return null;
			if (sink instanceof HlttProgramSink) {
				return new HlttCompiler(sink, this.y, innerCompiler);
			}
			return null;
		}
	}
	export function Y(inner: IHint) {
		return new Hint(true, inner);
	}
	export function X(inner: IHint) {
		return new Hint(false, inner);
	}

	export class HintFactory implements IHintFactory {
		public readonly type = TAG;
		public readJson(json: any, general: IHintFactory) {
			if (json && json.type === TAG && json.inner) {
				const inner = general.readJson(json.inner, general);
				if (inner) return new Hint(json.y, inner);
			}
			return null;
		}
	}

	export class HlttCompiler implements IHintCompiler {
		constructor(
			private readonly sink: HlttProgramSink,
			private readonly y: boolean,
			private readonly innerCompiler: IHintCompiler
		) {}
		public doCompile() {
			if (this.y) this.sink.addSegment($ => [$.svtca.y()]);
			else this.sink.addSegment($ => [$.svtca.x()]);
			this.innerCompiler.doCompile();
		}
	}
}
