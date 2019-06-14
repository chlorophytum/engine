import { IHintingModel, IHintingModelFactory } from "../interfaces";

import { Empty } from "./empty-hint";

export const EmptyHintingModelFactory: IHintingModelFactory = {
	type: "Chlorophytum::EmptyHinting",
	adopt<GID, VAR, MASTER>() {
		return new EmptyHintingModel<GID>();
	}
};

export class EmptyHintingModel<GID> implements IHintingModel<GID> {
	public readonly type = "Chlorophytum::EmptyHinting";

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
