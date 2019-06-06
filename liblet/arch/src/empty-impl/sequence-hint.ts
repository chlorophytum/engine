import { IFinalHintProgramSink, IHint, IHintCompiler, IHintFactory } from "../interfaces";

export namespace Sequence {
	const TAG = "Chlorophytum::SequenceHint";
	export class Hint implements IHint {
		constructor(private children: IHint[]) {}
		toJSON() {
			return { type: TAG, of: this.children.map(c => c.toJSON()) };
		}
		createCompiler(sink: IFinalHintProgramSink): IHintCompiler | null {
			let compilers: IHintCompiler[] = [];
			for (const part of this.children) {
				const c = part.createCompiler(sink);
				if (!c) return null;
				compilers.push(c);
			}
			return new Compiler(compilers);
		}
	}

	export class Factory implements IHintFactory {
		readonly type = TAG;
		readJson(json: any, general: IHintFactory) {
			if (json && json.type === TAG) {
				return new Hint(json.of.map((rep: any) => general.readJson(rep, general)));
			}
			return null;
		}
	}

	class Compiler implements IHintCompiler {
		constructor(private subCompilers: IHintCompiler[]) {}
		doCompile() {
			for (const sc of this.subCompilers) {
				sc.doCompile();
			}
		}
	}
}
