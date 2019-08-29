import { IFontSourceMetadata, IHint, IHintingModelPlugin } from "@chlorophytum/arch";
import * as Procs from "@chlorophytum/procs";
import { MessagePort, parentPort, workerData } from "worker_threads";

import { getHintingModelsAndParams } from "./env";
import { HintResults, HintWorkData, JobMessage } from "./hint-shared";

async function main(data: HintWorkData, parentPort: MessagePort) {
	const { models, params } = getHintingModelsAndParams(data.options);
	parentPort.on("message", _msg => {
		if (_msg.terminate) {
			process.exit(0);
		} else if (_msg.fontMetadata && _msg.jobRequest) {
			const msg = _msg as JobMessage<any, any>;
			doHint(models, params, msg.fontMetadata, msg.jobRequest).then(results =>
				parentPort.postMessage({ results })
			);
		}
	});
	parentPort.postMessage({ ready: true });
}

class Sender implements Procs.GlyphHintSender {
	public results: HintResults = [];
	public push(type: string, glyph: string, hints: IHint) {
		this.results.push({ type, glyph, hintRep: hints.toJSON() });
	}
}

async function doHint<VAR, MASTER>(
	models: IHintingModelPlugin[],
	params: any,
	fmd: IFontSourceMetadata,
	job: Procs.GlyphHintRequest<VAR, MASTER>
) {
	const sender = new Sender();
	await Procs.parallelGlyphHintWork(fmd, models, params, job, sender);
	return JSON.stringify(sender.results);
}

if (!parentPort) throw new Error("Must run inside a worker.");
main(workerData, parentPort).catch(e => {
	throw e;
});
