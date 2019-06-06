import { IFinalHintProgramSink, IHint, IHintCompiler, IHintFactory } from "../interfaces";

export namespace Empty {
	const TAG = "Chlorophytum::EmptyHint";
	export class Hint implements IHint {
		toJSON() {
			return { type: TAG };
		}
		createCompiler(sink: IFinalHintProgramSink): IHintCompiler | null {
			return new Compiler();
		}
	}

	export class HintFactory implements IHintFactory {
		readonly type = TAG;
		readJson(json: any) {
			if (json && json.type === TAG) return new Hint();
			return null;
		}
	}

	class Compiler implements IHintCompiler {
		doCompile() {}
	}
}
