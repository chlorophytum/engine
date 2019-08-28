import { EmptyLogger, IFontSource, IHint, IHintingModelPlugin } from "@chlorophytum/arch";
import * as Procs from "@chlorophytum/procs";
import * as fs from "fs";
import { MessagePort, parentPort, workerData } from "worker_threads";

import { getFontPlugin, getHintingModelsAndParams } from "./env";
import { HintResults, HintWorkData } from "./hint-shared";

async function main(data: HintWorkData, parentPort: MessagePort) {
	const FontFormatPlugin = getFontPlugin(data.options);
	const { models, params } = getHintingModelsAndParams(data.options);
	const otdStream = fs.createReadStream(data.input);
	const fontSource = await FontFormatPlugin.createFontSource(otdStream, data.input);

	parentPort.on("message", _msg => {
		if (_msg.terminate) {
			process.exit(0);
		} else if (_msg.job) {
			doHint(models, params, fontSource, _msg.job).then(results =>
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

async function doHint(
	models: IHintingModelPlugin[],
	params: any,
	fontSource: IFontSource<any, any, any>,
	job: Procs.GlyphHintJobs
) {
	const sender = new Sender();
	await Procs.parallelGlyphHintWork(fontSource, models, params, job, sender, new EmptyLogger());
	return JSON.stringify(sender.results);
}

if (!parentPort) throw new Error("Must run inside a worker.");
main(workerData, parentPort).catch(e => {
	throw e;
});
