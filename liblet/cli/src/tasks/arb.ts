import { IArbitratorProxy, IParallelCoTask, ITask } from "@chlorophytum/arch";

import { Progress } from "./progress";
import { IWorkerHostMain } from "./worker-host";

export interface IScopedTask<R> {
	readonly pass: number;
	readonly task: ITask<R>;
}

export interface IScopedTaskArg<RepArg> {
	readonly pass: number;
	readonly type: number;
	readonly repArgs: RepArg;
}

export interface IScopedTaskResult<R, RepArg, RepResult> {
	readonly pass: number;
	readonly task: IParallelCoTask<R, RepArg, RepResult>;
	readonly result: RepResult;
}

class TaskState<R> {
	constructor(private readonly arb: Arbitrator, private task: ITask<R>) {}
	private error: undefined | Error = undefined;
	private started = false;
	private finished = false;
	private result: undefined | R = undefined;
	private difficulty = 1;
	private listeners: ((result: R) => void)[] = [];
	private errorListeners: ((error: Error) => void)[] = [];

	private execImpl(): Promise<R> {
		return this.task.execute(this.arb);
	}

	private startImpl() {
		this.started = true;
		this.execImpl()
			.then(result => {
				this.arb.progress.end(this.difficulty);
				this.finished = true;
				this.result = result;
				for (const listener of this.listeners) listener(result);
				this.listeners = [];
			})
			.catch(e => {
				this.arb.progress.end(this.difficulty);
				this.finished = true;
				this.error = e;
				for (const listener of this.errorListeners) listener(e);
				this.errorListeners = [];
			});
	}

	public demand(): Promise<R> {
		if (this.error) throw this.error;
		if (this.finished) return Promise.resolve(this.result as R);
		return new Promise((resolve, reject) => {
			this.listeners.push(resolve);
			this.errorListeners.push(reject);
			if (!this.started) this.startImpl();
		});
	}
}

export class Arbitrator implements IArbitratorProxy, IWorkerHostMain {
	constructor(
		readonly serialOnly: boolean,
		private workerHost: IWorkerHostMain,
		readonly progress: Progress
	) {}

	private taskStateMap: Map<ITask<any>, TaskState<any>> = new Map();

	private getState<R>(task: ITask<R>): TaskState<R> {
		const existing: TaskState<R> | undefined = this.taskStateMap.get(task);
		if (existing) return existing;
		else {
			const state = new TaskState<R>(this, task);
			this.taskStateMap.set(task, state);
			return state;
		}
	}

	public demand<R>(task: ITask<R>) {
		let state = this.getState(task);
		return state.demand();
	}

	public startWorkerJob(type: string, argRep: any) {
		return this.workerHost.startWorkerJob(type, argRep);
	}

	private async runParallelCoTaskImpl<R, RepArg, RepResult>(
		pct: IParallelCoTask<R, RepArg, RepResult>
	) {
		const parallelRep = await pct.getArgRep();
		const resultRep = await this.startWorkerJob(pct.taskType, parallelRep);
		return await pct.getResult(resultRep);
	}
	public runParallelCoTask<R, RepArg, RepResult>(pct: IParallelCoTask<R, RepArg, RepResult>) {
		if (this.serialOnly) return null;
		return this.runParallelCoTaskImpl(pct);
	}
}
