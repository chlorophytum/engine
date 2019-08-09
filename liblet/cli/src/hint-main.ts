import {
	ConsoleLogger,
	EmptyImpl,
	HintMain,
	IHintFactory,
	IHintingModelPlugin,
	IHintStore,
	ILogger,
	Support
} from "@chlorophytum/arch";
import { MainHintJobControl } from "@chlorophytum/arch/lib/main/pre-hint";
import * as fs from "fs";
import { Worker } from "worker_threads";

import { getFontPlugin, getHintingModelsAndParams, HintOptions } from "./env";
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
		const jc: MainHintJobControl = { generateJob: options.jobs || 0 };
		const res = await HintMain.preHint(fontSource, models, params, jc, new ConsoleLogger());
		if (options.jobs) {
			console.log(`Process with ${options.jobs} threads...`);
			await startWorkers(options.jobs, input, options, res.remainingJobs, hf, res.hints);
		}
		const out = fs.createWriteStream(output);
		await res.hints.save(out);
	}
}

class Arbitrator {
	private items: [string, string][] = [];
	private ptr: number = 0;
	constructor(
		jc: HintMain.JobControl,
		private parallelJobs: number,
		prefix: string,
		private logger: ILogger
	) {
		if (!jc.jobs) throw new Error("jobs must be present");
		for (const k in jc.jobs) {
			const gsList = jc.jobs[k];
			for (let gName of gsList) this.items.push([k, gName]);
		}

		this.progress = new Support.Progress(prefix, this.items.length);
	}
	public fetch() {
		if (this.ptr >= this.items.length) return null;

		let jc: HintMain.JobControl = { jobs: {} };
		const step = Math.max(
			this.parallelJobs,
			Math.min(
				0x100,
				Math.round(
					Math.max(1, this.items.length - this.ptr) / Math.max(1, this.parallelJobs)
				)
			)
		);

		for (let count = 0; count < step && this.ptr < this.items.length; count++, this.ptr++) {
			const [ty, gName] = this.items[this.ptr];
			if (!jc.jobs![ty]) jc.jobs![ty] = [];
			jc.jobs![ty].push(gName);
		}
		return jc;
	}

	private progress: Support.Progress;

	public updateProgress() {
		this.progress.update(this.logger);
	}
}

async function startWorkers(
	n: number,
	input: string,
	options: HintOptions,
	jc: MainHintJobControl,
	hf: IHintFactory,
	hs: IHintStore
) {
	let promises: Promise<unknown>[] = [];
	const arbitrator = new Arbitrator(jc, n, `Parallel hinting ${input}`, new ConsoleLogger());
	for (let nth = 0; nth < n; nth++) {
		promises.push(startWorker(input, options, arbitrator, hf, hs));
	}
	await Promise.all(promises);
}

function startWorker(
	input: string,
	options: HintOptions,
	queue: Arbitrator,
	hf: IHintFactory,
	hs: IHintStore
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
			const nextJob = queue.fetch();
			if (nextJob) worker.postMessage({ job: nextJob });
			else worker.postMessage({ terminate: true });
		}

		async function saveResults(results: HintResults) {
			for (const { glyph, hintRep } of results) {
				const hint = hf.readJson(hintRep, hf);
				if (hint) {
					await hs.setGlyphHints(glyph, hint);
					queue.updateProgress();
				}
			}
		}

		worker.on("message", _msg => {
			if (_msg.ready) {
				next();
			} else if (_msg.log) {
				console.log(_msg.log);
			} else if (_msg.results) {
				const results: HintResults = JSON.parse(_msg.results);
				saveResults(results).then(() => next());
			}
		});
		worker.on("exit", () => resolve(null));
		worker.on("error", e => reject(e));
	});
}

process.on("warning", e => console.warn(e.stack));
