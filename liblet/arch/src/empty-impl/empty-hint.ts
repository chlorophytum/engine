import { IFinalHintProgramSink, IHint, IHintCompiler, IHintFactory } from "../interfaces";

export namespace Empty {
	const TAG = "Chlorophytum::EmptyHint";
	export class Hint implements IHint {
		public toJSON() {
			return { type: TAG };
		}
		public createCompiler(sink: IFinalHintProgramSink): IHintCompiler | null {
			return new Compiler();
		}
	}

	export class Factory implements IHintFactory {
		public readonly type = TAG;
		public readJson(json: any) {
			if (json && json.type === TAG) return new Hint();
			return null;
		}
	}

	class Compiler implements IHintCompiler {
		public doCompile() {}
	}
}
