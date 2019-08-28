import {
	ConsoleLogger,
	EmptyImpl,
	HintingModelConfig,
	IFontSource,
	IHintFactory,
	IHintingModelPlugin
} from "@chlorophytum/arch";
import * as Procs from "@chlorophytum/procs";
import * as fs from "fs";
import { Worker } from "worker_threads";

import { getFontPlugin, getHintingModelsAndParams, HintOptions } from "./env";
import { HintArbitrator } from "./hint-arbitrator";
import { HintResults, HintWorkData } from "./hint-shared";

function createHintFactory(models: IHintingModelPlugin[]): IHintFactory {
	const hfs: IHintFactory[] = [];
	for (const plugin of models) {
		for (const hf of plugin.hintFactories) {
			hfs.push(hf);
		}
	}

	return new EmptyImpl.FallbackHintFactory(hfs);
}

export async function doHint(options: HintOptions, jobs: [string, string][]) {
	const FontFormatPlugin = getFontPlugin(options);
	const { models, params } = getHintingModelsAndParams(options);
	const hf = createHintFactory(models);
	for (const [input, output] of jobs) {
		const otdStream = fs.createReadStream(input);
		const fontSource = await FontFormatPlugin.createFontSource(otdStream, input);
		const hintStore = await hintFont(options, input, fontSource, models, params);
		const out = fs.createWriteStream(output);
		await hintStore.save(out);
	}
}

async function hintFont(
	options: HintOptions,
	input: string,
	fontSource: IFontSource<any, any, any>,
	models: IHintingModelPlugin[],
	modelConfig: HintingModelConfig[]
) {
	const logger = new ConsoleLogger();
	const serial = await Procs.serialGlyphHint(fontSource, models, modelConfig, logger);
	const { jobs, ghsMap: parallel } = await Procs.generateParallelGlyphHintJobs(
		fontSource,
		models,
		modelConfig
	);

	const parallelJobs = options.jobs || 1;
	if (parallel.size) {
		const hf = createHintFactory(models);
		await parallelGlyphHint(parallelJobs, input, options, jobs, hf, parallel);
		await Procs.parallelGlyphHintShared(fontSource, models, modelConfig, parallel);
	}

	const hintStore = fontSource.createHintStore();
	for (const [type, ghs] of [...serial, ...parallel]) {
		for (const [g, hints] of ghs.glyphHints) await hintStore.setGlyphHints(g, hints);
		if (ghs.sharedHints) await hintStore.setSharedHints(type, ghs.sharedHints);
	}
	return hintStore;
}

async function parallelGlyphHint(
	n: number,
	input: string,
	options: HintOptions,
	jc: Procs.GlyphHintJobs,
	hf: IHintFactory,
	ghsMap: Map<string, Procs.GlyphHintStore>
) {
	let promises: Promise<unknown>[] = [];
	const arbitrator = new HintArbitrator(jc, n, `Parallel hinting ${input}`, new ConsoleLogger());
	for (let nth = 0; nth < n; nth++) {
		promises.push(startWorker(input, options, arbitrator, hf, ghsMap));
	}
	await Promise.all(promises);
}

function startWorker(
	input: string,
	options: HintOptions,
	arb: HintArbitrator,
	hf: IHintFactory,
	ghsMap: Map<string, Procs.GlyphHintStore>
) {
	return new Promise((resolve, reject) => {
		const workerData: HintWorkData = {
			input,
			options
		};
		const worker = new Worker(__dirname + "/hint-worker.js", {
			workerData,
			stdout: true,
			stderr: true
		});

		function next() {
			const nextJob = arb.fetch();
			if (nextJob) worker.postMessage({ job: nextJob });
			else worker.postMessage({ terminate: true });
		}

		function saveResults(results: HintResults) {
			for (const { type, glyph, hintRep } of results) {
				const ghs = ghsMap.get(type);
				if (!ghs) continue;
				const hint = hf.readJson(hintRep, hf);
				if (hint) {
					ghs.glyphHints.set(glyph, hint);
					arb.updateProgress();
				}
				arb.updateProgress();
			}
		}

		worker.on("message", _msg => {
			if (_msg.ready) {
				next();
			} else if (_msg.log) {
				console.log(_msg.log);
			} else if (_msg.results) {
				const results: HintResults = JSON.parse(_msg.results);
				saveResults(results);
				next();
			}
		});
		worker.on("exit", () => resolve(null));
		worker.on("error", e => reject(e));
	});
}

process.on("warning", e => console.warn(e.stack));
