import { MessagePort, parentPort, workerData } from "worker_threads";

import { IHintingPass } from "@chlorophytum/arch";

import { getHintingPasses } from "../env";

import { HintWorkData, TaskMessage } from "./shared";

async function main(data: HintWorkData, parentPort: MessagePort) {
	const passes = await getHintingPasses(data.options);
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

async function doHint(pass: IHintingPass, msg: TaskMessage) {
	const pt = pass.createParallelTask(msg.taskType, msg.taskArgs);
	if (!pt) throw new Error(`Cannot construct task for ${msg.taskType}`);
	return await pt.execute();
}

if (!parentPort) throw new Error("Must run inside a worker.");
main(workerData, parentPort).catch(e => {
	throw e;
});
