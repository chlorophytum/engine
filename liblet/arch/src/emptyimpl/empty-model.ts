import { IHintingModel, IHintingModelFactory } from "../interfaces";

import { EmptyHint } from "./empty-hint";

export const EmptyHintingModelFactory: IHintingModelFactory = {
	adopt<GID, VAR, MASTER>() {
		return new EmptyHintingModel<GID>();
	}
};

export class EmptyHintingModel<GID> implements IHintingModel<GID> {
	readonly type = "Chlorophytum::EmptyHintingModel";

	constructor() {}

	analyzeSharedParameters() {
		return null;
	}
	getSharedHints() {
		return new EmptyHint();
	}
	analyzeGlyph(gid: GID) {
		return new EmptyHint();
	}
}