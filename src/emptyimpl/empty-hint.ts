import { IFinalHintSink, IHint, IHintCompiler, IHintFactory } from "../interfaces";

export class EmptyHint implements IHint {
	toJSON() {
		return { type: "Chlorophytum::EmptyHint" };
	}
	createCompiler(sink: IFinalHintSink) {
		return new EmptyHintCompiler();
	}
}

export class EmptyHintFactory implements IHintFactory {
	readJson(json: any) {
		if (json && json.type === "Chlorophytum::EmptyHint") return new EmptyHint();
		return null;
	}
}

export class EmptyHintCompiler implements IHintCompiler {
	doCompile() {}
}
