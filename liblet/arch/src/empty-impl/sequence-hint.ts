import { IFinalHintProgramSink, IHint, IHintCompiler, IHintFactory } from "../interfaces";

export namespace Sequence {
	const TAG = "Chlorophytum::SequenceHint";
	export class Hint implements IHint {
		constructor(private children: IHint[]) {}
		public toJSON() {
			return { type: TAG, of: this.children.map(c => c.toJSON()) };
		}
		public createCompiler(sink: IFinalHintProgramSink): IHintCompiler | null {
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
		public readonly type = TAG;
		public readJson(json: any, general: IHintFactory) {
			if (json && json.type === TAG) {
				let hs: IHint[] = [];
				for (const h of json.of) {
					let h1 = general.readJson(h, general);
					if (h1) hs.push(h1);
					else return null;
				}
				return new Hint(hs);
			}
			return null;
		}
	}

	class Compiler implements IHintCompiler {
		constructor(private subCompilers: IHintCompiler[]) {}
		public doCompile() {
			for (const sc of this.subCompilers) {
				sc.doCompile();
			}
		}
	}
}
