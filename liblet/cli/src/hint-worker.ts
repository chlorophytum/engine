import { EmptyLogger, HintMain, IFontSource, IHintingModelPlugin } from "@chlorophytum/arch";
import * as fs from "fs";
import { MessagePort, parentPort, workerData } from "worker_threads";

import { getFontPlugin, getHintingModelsAndParams } from "./env";
import { HintWorkData } from "./hint-shared";

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

async function doHint(
	models: IHintingModelPlugin[],
	params: any,
	fontSource: IFontSource<any, any, any>,
	job: HintMain.JobControl
) {
	const res = await HintMain.preHint(fontSource, models, params, job, new EmptyLogger());
	let results: { glyph: string; hintRep: any }[] = [];
	for (const g of await res.hints.listGlyphs()) {
		const hint = await res.hints.getGlyphHints(g);
		if (hint) results.push({ glyph: g, hintRep: hint.toJSON() });
	}
	return JSON.stringify(results);
}

if (!parentPort) throw new Error("Must run inside a worker.");
main(workerData, parentPort).catch(e => {
	throw e;
});
