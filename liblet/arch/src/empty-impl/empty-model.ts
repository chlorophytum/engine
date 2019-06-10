import { IHintingModel, IHintingModelFactory } from "../interfaces";

import { Empty } from "./empty-hint";

export const EmptyHintingModelFactory: IHintingModelFactory = {
	type: "Chlorophytum::EmptyHinting",
	adopt<GID, VAR, MASTER>() {
		return new EmptyHintingModel<GID>();
	}
};

export class EmptyHintingModel<GID> implements IHintingModel<GID> {
	readonly type = "Chlorophytum::EmptyHinting";

	constructor() {}

	analyzeSharedParameters() {
		return null;
	}
	getSharedHints() {
		return new Empty.Hint();
	}
	analyzeGlyph(gid: GID) {
		return new Empty.Hint();
	}
}
