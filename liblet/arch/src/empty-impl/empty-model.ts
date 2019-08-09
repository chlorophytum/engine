import { IHintingModel, IHintingModelPlugin } from "../interfaces";

import { Empty } from "./empty-hint";
import { Sequence } from "./sequence-hint";

export const EmptyHintingModelFactory: IHintingModelPlugin = {
	type: "Chlorophytum::EmptyHinting",
	adopt<GID, VAR, MASTER>() {
		return new EmptyHintingModel<GID>();
	},
	hintFactories: [new Empty.Factory(), new Sequence.Factory()]
};

export class EmptyHintingModel<GID> implements IHintingModel<GID> {
	public readonly type = "Chlorophytum::EmptyHinting";
	public readonly allowParallel = false;

	constructor() {}

	public async analyzeSharedParameters() {
		return null;
	}
	public async getSharedHints() {
		return new Empty.Hint();
	}
	public async analyzeGlyph(gid: GID) {
		return new Empty.Hint();
	}
}
