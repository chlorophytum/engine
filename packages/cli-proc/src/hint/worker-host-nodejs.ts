/* eslint-disable @typescript-eslint/no-explicit-any */
import { Worker } from "worker_threads";

import { ProcOptions } from "../env";
import { IWorkerHostMain } from "../tasks/worker-host";

import { HintWorkData, TaskErrorMessage, TaskMessage, TaskResultMessage } from "./shared";

class Queue {
	private queue: TaskMessage[] = [];
	public add(message: TaskMessage) {
		this.queue.push(message);
	}
	public next() {
		return this.queue.shift();
	}
}

export class Host implements IWorkerHostMain {
	constructor(private capacity: number, private readonly options: ProcOptions) {}

	private n = 0;
	public queue: Queue = new Queue();
	public workers: (null | Worker)[] = [];
	public coTasks: ((result: any) => void)[] = [];
	public error(e: Error) {
		console.error(e);
		process.exit(1);
	}

	public startWorkerJob(type: string, argRep: any): Promise<any> {
		return new Promise((resolve, reject) => {
			const taskID = this.n++;
			this.coTasks[taskID] = result => resolve(result);
			this.queue.add({ taskID, taskType: type, taskArgs: argRep });
			if (this.tid === null) {
				this.tid = setTimeout(() => this.initWorkers(), 100);
			}
		});
	}

	private tid: null | NodeJS.Timeout = null;
	private initWorkers() {
		for (let j = 0; j < this.capacity; j++) {
			if (!this.workers[j]) startWorker(j, this, this.options);
		}
		this.tid = null;
	}
}

function startWorker(id: number, host: Host, options: ProcOptions) {
	const workerData: HintWorkData = { options };
	const worker = new Worker(__dirname + "/worker-nodejs.js", {
		workerData,
		stdout: true,
		stderr: true
	});

	function next() {
		const msg = host.queue.next();
		if (!msg) {
			host.workers[id] = null;
			worker.postMessage({ terminate: true });
		} else {
			worker.postMessage(msg);
		}
	}

	function saveResults(msg: TaskResultMessage) {
		host.coTasks[msg.taskID](msg.taskResult);
	}

	worker.on("message", _msg => {
		if (_msg.ready) {
			next();
		} else if (_msg.log) {
			console.log(_msg.log);
		} else if (_msg.taskResult) {
			const msg = _msg as TaskResultMessage;
			saveResults(msg);
			next();
		} else if (_msg.taskError) {
			const msg = _msg as TaskErrorMessage;
			host.error(new Error(msg.taskError));
		}
	});
	worker.on("error", e => host.error(e));
}
