import {
	IFinalHintProgramSink,
	IHint,
	IHintCompiler,
	IHintFactory,
	PropertyBag,
} from "@chlorophytum/arch";

export namespace Empty {
	const TAG = "Chlorophytum::EmptyHint";
	export class Hint implements IHint {
		public toJSON() {
			return { type: TAG };
		}
		public createCompiler(bag: PropertyBag, sink: IFinalHintProgramSink): IHintCompiler | null {
			return new Compiler();
		}
		public traverse() {}
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
