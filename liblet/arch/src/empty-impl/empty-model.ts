import { IHintingModel, IHintingModelPlugin } from "../interfaces";

import { Empty } from "./empty-hint";
import { Sequence } from "./sequence-hint";

export const EmptyHintingModelFactory: IHintingModelPlugin = {
	type: "Chlorophytum::EmptyHinting",
	adopt<GID, VAR, MASTER>() {
		return new EmptyHintingModel<GID>();
	},
	hintFactories: [new Empty.Factory(), new Sequence.Factory()],
	createParallelTask() {
		return null;
	}
};

export class EmptyHintingModel<GID> implements IHintingModel {
	public readonly type = "Chlorophytum::EmptyHinting";
	public readonly allowParallel = false;
	constructor() {}
	public getHintingTask() {
		return null;
	}
}
