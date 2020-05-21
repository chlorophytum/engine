import { IHintingModel, IHintingModelPlugin, IHintingPass } from "../interfaces";

import { Empty } from "./empty-hint";

export const EmptyHintingModelFactory: IHintingModelPlugin = {
	async load() {
		return new EmptyHintingPass();
	}
};

class EmptyHintingPass implements IHintingPass {
	public requirePreHintRounds = 0;
	public factoriesOfUsedHints = [new Empty.Factory()];
	public adopt<GID>() {
		return new EmptyHintingModel<GID>();
	}
	public createParallelTask() {
		return null;
	}
}

export class EmptyHintingModel<GID> implements IHintingModel {
	public readonly type = "Chlorophytum::EmptyHinting";
	public readonly allowParallel = false;
	constructor() {}
	public getHintingTask() {
		return null;
	}
}
