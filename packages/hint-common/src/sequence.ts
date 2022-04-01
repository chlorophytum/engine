import {
	IFinalHintProgramSink,
	IHint,
	IHintCompiler,
	IHintFactory,
	IHintTraveler,
	PropertyBag
} from "@chlorophytum/arch";

export namespace Sequence {
	const TAG = "Chlorophytum::SequenceHint";
	export class Hint implements IHint {
		constructor(private children: IHint[]) {}
		public toJSON() {
			return { type: TAG, of: this.children.map(c => c.toJSON()) };
		}
		public createCompiler(bag: PropertyBag, sink: IFinalHintProgramSink): IHintCompiler | null {
			const compilers: IHintCompiler[] = [];
			for (const part of this.children) {
				const c = part.createCompiler(bag, sink);
				if (!c) return null;
				compilers.push(c);
			}
			return new Compiler(compilers);
		}
		public traverse(bag: PropertyBag, traveler: IHintTraveler) {
			for (const ch of this.children) traveler.traverse(bag, ch);
		}
	}

	export class Factory implements IHintFactory {
		public readonly type = TAG;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		public readJson(json: any, general: IHintFactory) {
			if (json && json.type === TAG) {
				const hs: IHint[] = [];
				for (const h of json.of) {
					const h1 = general.readJson(h, general);
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
