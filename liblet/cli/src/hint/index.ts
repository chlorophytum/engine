import {
	ConsoleLogger,
	EmptyImpl,
	HintingPass,
	IFontSource,
	IHint,
	IHintFactory,
	IHintingModelPlugin,
	ILogger
} from "@chlorophytum/arch";
import * as Procs from "@chlorophytum/procs";
import { IHintCacheManager } from "@chlorophytum/procs";
import * as fs from "fs";
import { Worker } from "worker_threads";

import { getFontPlugin, getHintingPasses, HintOptions } from "../env";

import { HintArbitrator } from "./arbitrator";
import { HintResults, HintWorkData } from "./shared";

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

	const logger = new ConsoleLogger();
	logger.log("Auto hint");

	{
		const briefLogger = logger.bullet(" * ");
		for (const [input, output] of jobs) {
			briefLogger.log(`Job: ${input} -> ${output}`);
		}
	}
	{
		const jobLogger = logger.bullet(" + ");
		for (const [input, output] of jobs) {
			jobLogger.log(`Auto hinting ${input} -> ${output}`);
			const otdStream = fs.createReadStream(input);
			const fontSource = await FontFormatPlugin.createFontSource(otdStream, input);
			const hintStore = await hintFont(
				{ fontSource, options, logger: jobLogger.indent("  ").bullet(" - "), hf, hc },
				input,
				passes
			);
			const out = fs.createWriteStream(output);
			await hintStore.save(out);
		}
	}
}

interface HintImplState<GID> {
	fontSource: IFontSource<GID>;
	options: HintOptions;
	logger: ILogger;
	hf: IHintFactory;
	hc: HintCache;
}

async function hintFont<GID>(st: HintImplState<GID>, input: string, passes: HintingPass[]) {
	const parallelJobs = st.options.jobs || 1;
	const forceSerial = parallelJobs <= 1;
	const serial = await Procs.serialGlyphHint(
		st.fontSource,
		passes,
		st.hc,
		forceSerial,
		st.logger
	);
	const { jobs, ghsMap: parallel } = await Procs.generateParallelGlyphHintJobs(
		st.fontSource,
		passes,
		st.hc,
		forceSerial
	);

	if (parallel.size) {
		await parallelGlyphHint(st, parallelJobs, jobs, input, parallel);
		await Procs.parallelGlyphHintShared(st.fontSource, passes, parallel);
	}

	const hintStore = st.fontSource.createHintStore();
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

async function parallelGlyphHint<GID>(
	st: HintImplState<GID>,
	n: number,
	jc: Procs.GlyphHintJobs,
	input: string,
	ghsMap: Map<string, Procs.GlyphHintStore>
) {
	let promises: Promise<unknown>[] = [];
	const arbitrator = new HintArbitrator(
		st.fontSource,
		jc,
		n,
		`Parallel hinting ${input}`,
		st.logger
	);
	for (let nth = 0; nth < n; nth++) {
		promises.push(startWorker(input, st.options, arbitrator, st.hf, st.hc, ghsMap));
	}
	await Promise.all(promises);
	arbitrator.updateProgress();
}

function startWorker<GID>(
	input: string,
	options: HintOptions,
	arb: HintArbitrator<GID>,
	hf: IHintFactory,
	hc: HintCache,
	ghsMap: Map<string, Procs.GlyphHintStore>
) {
	return new Promise((resolve, reject) => {
		const workerData: HintWorkData = {
			input,
			options
		};
		const worker = new Worker(__dirname + "/worker.js", {
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
