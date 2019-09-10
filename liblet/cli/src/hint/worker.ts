import { HintingPass, IParallelTask } from "@chlorophytum/arch";
import { MessagePort, parentPort, workerData } from "worker_threads";

import { getHintingPasses } from "../env";

import { HintWorkData, TaskMessage } from "./shared";

async function main(data: HintWorkData, parentPort: MessagePort) {
	const passes = getHintingPasses(data.options);
	parentPort.on("message", _msg => {
		if (_msg.terminate) {
			process.exit(0);
		} else if (_msg.taskType && _msg.taskArgs) {
			const msg = _msg as TaskMessage;
			doHint(passes, msg)
				.then(result => parentPort.postMessage({ taskID: msg.taskID, taskResult: result }))
				.catch(e => parentPort.postMessage({ taskID: msg.taskID, taskError: "" + e }));
		}
	});
	parentPort.postMessage({ ready: true });
}

async function doHint(passes: HintingPass[], msg: TaskMessage) {
	let pt: null | IParallelTask<any> = null;
	for (const pass of passes) {
		pt = pass.plugin.createParallelTask(msg.taskType, msg.taskArgs);
		if (pt) break;
	}
	if (!pt) throw new Error(`Cannot construct task for ${msg.taskType}`);
	return await pt.execute();
}

if (!parentPort) throw new Error("Must run inside a worker.");
main(workerData, parentPort).catch(e => {
	throw e;
});
