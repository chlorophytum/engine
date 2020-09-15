export interface ITask<R> {
	execute(arbitrator: IArbitratorProxy): Promise<R>;
	tryGetDifficulty?(): Promise<number>;
}

export interface IArbitratorProxy {
	demand<R>(task: ITask<R>): Promise<R>;
	runParallelCoTask<R, RepArg, RepResult>(
		pct: IParallelCoTask<R, RepArg, RepResult>
	): null | Promise<R>;
}

// Parallelism
export interface IParallelTaskFactory {
	createParallelTask<RepArg>(type: string, args: RepArg): null | IParallelTask<unknown>;
}
export interface IParallelTask<RepResult> {
	execute(): Promise<RepResult>;
}

export interface IParallelCoTask<R, RepArg, RepResult> {
	readonly taskType: string;
	getArgRep(): Promise<RepArg>;
	getResult(rep: RepResult): Promise<R>;
}
