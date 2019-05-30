import { IFinalHintSink, IHint, IHintCompiler, IHintFactory } from "../interfaces";

export class SequenceHint implements IHint {
	constructor(private children: IHint[]) {}
	toJSON() {
		return { type: "Chlorophytum::SequenceHint", of: this.children.map(c => c.toJSON()) };
	}
	createCompiler(sink: IFinalHintSink) {
		let compilers: IHintCompiler[] = [];
		for (const part of this.children) {
			const c = part.createCompiler(sink);
			if (!c) return null;
			compilers.push(c);
		}
		return new SequenceHintCompiler(compilers);
	}
}

export class SequenceHintFactory implements IHintFactory {
	readJson(json: any, general: IHintFactory) {
		if (json && json.type === "Chlorophytum::SequenceHint") {
			return new SequenceHint(json.of.map((rep: any) => general.readJson(rep, general)));
		}
		return null;
	}
}

export class SequenceHintCompiler implements IHintCompiler {
	constructor(private subCompilers: IHintCompiler[]) {}
	doCompile() {
		for (const sc of this.subCompilers) {
			sc.doCompile();
		}
	}
}
