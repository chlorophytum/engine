import {
	ConsoleLogger,
	EmptyImpl,
	HintingPass,
	IFontSource,
	IHint,
	IHintFactory,
	IHintingModelPlugin
} from "@chlorophytum/arch";
import * as Procs from "@chlorophytum/procs";
import { IHintCacheManager } from "@chlorophytum/procs";
import * as fs from "fs";
import { Worker } from "worker_threads";

import { getFontPlugin, getHintingPasses, HintOptions } from "./env";
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

class HintCache implements IHintCacheManager {
	constructor(private readonly hf: IHintFactory) {}
	private store = new Map<string, any>();
	public getCache(id: null | string) {
		if (!id) return undefined;
		const hintRep = this.store.get(id);
		if (!hintRep) return undefined;
		return this.hf.readJson(hintRep, this.hf);
	}
	public setCache(id: null | string, hint: IHint) {
		if (!id || !hint) return;
		this.store.set(id, hint.toJSON());
	}
}

export async function doHint(options: HintOptions, jobs: [string, string][]) {
	const FontFormatPlugin = getFontPlugin(options);
	const passes = getHintingPasses(options);
	const modelPlugins = Array.from(new Set(passes.map(p => p.plugin)));
	const hf = createHintFactory(modelPlugins);
	const hc = new HintCache(hf);

	console.log("Auto hint");
	for (const [input, output] of jobs) {
		console.log(` * Job: ${input} -> ${output}`);
	}

	for (const [input, output] of jobs) {
		console.log(` - Auto hinting ${input} -> ${output}`);
		const otdStream = fs.createReadStream(input);
		const fontSource = await FontFormatPlugin.createFontSource(otdStream, input);
		const hintStore = await hintFont(options, input, fontSource, hf, hc, passes);
		const out = fs.createWriteStream(output);
		await hintStore.save(out);
	}
}

async function hintFont<GID, VAR, MASTER>(
	options: HintOptions,
	input: string,
	fontSource: IFontSource<GID, VAR, MASTER>,
	hf: IHintFactory,
	hc: HintCache,
	passes: HintingPass[]
) {
	const logger = new ConsoleLogger();
	const parallelJobs = options.jobs || 1;
	const serial = await Procs.serialGlyphHint(fontSource, passes, hc, parallelJobs <= 1, logger);
	const { jobs, ghsMap: parallel } = await Procs.generateParallelGlyphHintJobs(
		fontSource,
		passes,
		hc,
		parallelJobs <= 1
	);

	if (parallel.size) {
		await parallelGlyphHint(fontSource, parallelJobs, input, options, jobs, hf, hc, parallel);
		await Procs.parallelGlyphHintShared(fontSource, passes, parallel);
	}

	const hintStore = fontSource.createHintStore();
	for (const [passID, ghs] of [...serial, ...parallel]) {
		for (const [g, hints] of ghs.glyphHints) {
			await hintStore.setGlyphHints(g, hints);
			const ck = ghs.glyphCacheKeys.get(g);
			if (ck) await hintStore.setGlyphHintsCacheKey(g, ck);
		}

		if (ghs.sharedHints) await hintStore.setSharedHints(passID, ghs.sharedHints);
	}
	return hintStore;
}

async function parallelGlyphHint<GID, VAR, MASTER>(
	fontSource: IFontSource<GID, VAR, MASTER>,
	n: number,
	input: string,
	options: HintOptions,
	jc: Procs.GlyphHintJobs,
	hf: IHintFactory,
	hc: HintCache,
	ghsMap: Map<string, Procs.GlyphHintStore>
) {
	let promises: Promise<unknown>[] = [];
	const arbitrator = new HintArbitrator(
		fontSource,
		jc,
		n,
		`Parallel hinting ${input}`,
		new ConsoleLogger()
	);
	for (let nth = 0; nth < n; nth++) {
		promises.push(startWorker(input, options, arbitrator, hf, hc, ghsMap));
	}
	await Promise.all(promises);
	arbitrator.updateProgress();
}

function startWorker<GID, VAR, MASTER>(
	input: string,
	options: HintOptions,
	arb: HintArbitrator<GID, VAR, MASTER>,
	hf: IHintFactory,
	hc: HintCache,
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
			arb.fetch().then(nextJob => {
				if (nextJob) worker.postMessage(nextJob);
				else worker.postMessage({ terminate: true });
			});
		}

		function saveResults(results: HintResults) {
			for (const { passID, glyph, cacheKey, hintRep } of results) {
				const ghs = ghsMap.get(passID);
				if (!ghs) continue;
				const hint = hf.readJson(hintRep, hf);
				if (hint) {
					ghs.glyphHints.set(glyph, hint);
					if (cacheKey && !hc.getCache(cacheKey)) hc.setCache(cacheKey, hint);
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
