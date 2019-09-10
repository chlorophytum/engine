import {
	ConsoleLogger,
	EmptyImpl,
	HintingPass,
	IFontSource,
	IHintFactory,
	IHintingModelExecEnv,
	IHintingModelPlugin,
	IHintStore,
	ILogger,
	ITask
} from "@chlorophytum/arch";
import * as fs from "fs";

import { getFontPlugin, getHintingPasses, HintOptions } from "../env";
import { Arbitrator } from "../tasks/arb";
import { Progress } from "../tasks/progress";

import { HintCache } from "./cache";
import { Host } from "./worker-host";

export interface HintRestOptions {
	cacheFilePath?: null | undefined | string;
}

export async function doHint(
	options: HintOptions,
	restOptions: HintRestOptions,
	jobs: [string, string][]
) {
	const FontFormatPlugin = getFontPlugin(options);
	const passes = getHintingPasses(options);
	const modelPlugins = Array.from(new Set(passes.map(p => p.plugin)));
	const hf = createHintFactory(modelPlugins);
	const hc = new HintCache(hf);

	const logger = new ConsoleLogger();
	logger.log("Auto hint");

	await setupCache(logger, hc, restOptions);

	{
		const briefLogger = logger.bullet(" * ");
		for (const [input, output] of jobs) {
			briefLogger.log(`Job: ${input} -> ${output}`);
		}
	}
	{
		const jobLogger = logger.bullet(" + ");
		for (const [input, output] of jobs) {
			const otdStream = fs.createReadStream(input);
			const fontSource = await FontFormatPlugin.createFontSource(otdStream, input);
			const hintStore = await hintFont(
				{
					from: input,
					fontSource,
					options,
					logger: jobLogger.bullet(" - "),
					hf,
					hc
				},
				passes
			);
			jobLogger.log(`Saving analysis result : ${input} -> ${output}`);
			const out = fs.createWriteStream(output);
			await hintStore.save(out);
		}
	}

	await saveCache(logger, hc, restOptions);
}

function createHintFactory(models: IHintingModelPlugin[]): IHintFactory {
	const hfs: IHintFactory[] = [];
	for (const plugin of models) {
		for (const hf of plugin.hintFactories) {
			hfs.push(hf);
		}
	}

	return new EmptyImpl.FallbackHintFactory(hfs);
}

async function setupCache(logger: ILogger, hc: HintCache, hro: HintRestOptions) {
	if (!hro.cacheFilePath) return;
	if (!fs.existsSync(hro.cacheFilePath)) return;
	logger.bullet(` + `).log(`Reading cache <- ${hro.cacheFilePath}`);
	const input = fs.createReadStream(hro.cacheFilePath);
	await hc.load(input);
}
async function saveCache(logger: ILogger, hc: HintCache, hro: HintRestOptions) {
	if (!hro.cacheFilePath) return;
	logger.bullet(` + `).log(`Saving cache -> ${hro.cacheFilePath}`);
	const output = fs.createWriteStream(hro.cacheFilePath);
	await hc.save(output);
}

interface HintImplState<GID> {
	from: string;
	fontSource: IFontSource<GID>;
	options: HintOptions;
	logger: ILogger;
	hf: IHintFactory;
	hc: HintCache;
}

async function hintFont<GID>(st: HintImplState<GID>, passes: HintingPass[]) {
	let tasks: ITask<unknown>[] = [];
	let localHintStores: IHintStore[] = [];
	for (const pass of passes) {
		const hm = pass.plugin.adopt(st.fontSource, pass.parameters);
		if (!hm) continue;
		const hs = st.fontSource.createHintStore();
		if (!hs) continue;

		localHintStores.push(hs);

		const env: IHintingModelExecEnv = {
			passUniqueID: pass.uniqueID,
			hintFactory: st.hf,
			modelLocalHintStore: hs,
			cacheManager: st.hc
		};
		const task = hm.getHintingTask(env);
		if (!task) continue;
		tasks.push(task);
	}
	const capacity = st.options.jobs || 1;
	st.logger.log(`Analyzing ${st.from} with ${capacity} threads...`);
	const progress = new Progress(`Analyzing ${st.from}`, st.logger);

	const host = new Host(capacity, st.options);
	const arb = new Arbitrator(capacity <= 1, host, progress);
	await Promise.all(tasks.map(task => arb.demand(task)));

	const hsAll = st.fontSource.createHintStore();
	for (const store of localHintStores) {
		await combineHintStore(store, hsAll);
	}
	return hsAll;
}
async function combineHintStore(from: IHintStore, to: IHintStore) {
	for (const g of await from.listGlyphs()) {
		const gh = await from.getGlyphHints(g);
		if (gh) to.setGlyphHints(g, gh);
		const ck = await from.getGlyphHintsCacheKey(g);
		if (ck) to.setGlyphHintsCacheKey(g, ck);
	}
	for (const st of await from.listSharedTypes()) {
		const sh = await from.getSharedHints(st);
		if (sh) to.setSharedHints(st, sh);
	}
}

process.on("warning", e => console.warn(e.stack));
