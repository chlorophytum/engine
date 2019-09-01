import { HintingPass, IFontSourceMetadata, IHint } from "@chlorophytum/arch";
import * as Procs from "@chlorophytum/procs";
import { MessagePort, parentPort, workerData } from "worker_threads";

import { getHintingPasses } from "./env";
import { HintResults, HintWorkData, JobMessage } from "./hint-shared";

async function main(data: HintWorkData, parentPort: MessagePort) {
	const passes = getHintingPasses(data.options);
	parentPort.on("message", _msg => {
		if (_msg.terminate) {
			process.exit(0);
		} else if (_msg.fontMetadata && _msg.jobRequests) {
			const msg = _msg as JobMessage;
			doHint(passes, msg.fontMetadata, msg.jobRequests).then(results =>
				parentPort.postMessage({ results })
			);
		}
	});
	parentPort.postMessage({ ready: true });
}

class Sender implements Procs.GlyphHintSender {
	public results: HintResults = [];
	public push(passID: string, glyph: string, cacheKey: null | string, hints: IHint) {
		this.results.push({ passID, glyph, cacheKey, hintRep: hints.toJSON() });
	}
}

async function doHint(
	passes: HintingPass[],
	fmd: IFontSourceMetadata,
	job: Procs.GlyphHintRequests
) {
	const sender = new Sender();
	await Procs.parallelGlyphHintWork(fmd, passes, job, sender);
	return JSON.stringify(sender.results);
}

if (!parentPort) throw new Error("Must run inside a worker.");
main(workerData, parentPort).catch(e => {
	throw e;
});
