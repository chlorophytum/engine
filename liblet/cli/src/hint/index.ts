import {
	AutoHintingPass,
	ConsoleLogger,
	EmptyImpl,
	IHintFactory,
	IHintingModelExecEnv,
	IHintingModelPlugin,
	IHintingModelPreEnv,
	IHintStore,
	ILogger,
	ITask,
	PropertyBag
} from "@chlorophytum/arch";
import { MemoryHintStore } from "@chlorophytum/hint-store-memory";
import * as fs from "fs";

import { getFontPlugin, getHintingPasses, getHintStoreProvider, HintOptions } from "../env";
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
	const passes = getHintingPasses(options);
	const modelPlugins = Array.from(new Set(passes.map(p => p.plugin)));
	const hf = createHintFactory(modelPlugins);
	const hc = new HintCache(hf);

	const logger = new ConsoleLogger();
	logger.log("Auto hint");

	await setupCache(logger, hc, restOptions);
	const carry = new PropertyBag();

	let totalPreHintRounds: number = 0;
	for (const plugin of modelPlugins) {
		if (plugin.requiredPreHintRounds && plugin.requiredPreHintRounds > totalPreHintRounds) {
			totalPreHintRounds = plugin.requiredPreHintRounds;
		}
	}

	{
		const briefLogger = logger.bullet(" * ");
		for (const [input, output] of jobs) {
			briefLogger.log(`Job: ${input} -> ${output}`);
		}
	}
	for (let round = 0; round < totalPreHintRounds; round++) {
		const jobLogger = logger.bullet(" + ");
		for (let jid = 0; jid < jobs.length; jid++) {
			const [input, output] = jobs[jid];
			await preHintFont(passes, {
				round,
				fontIndex: jid,
				totalFonts: jobs.length,
				input,
				output,
				options,
				logger: jobLogger.bullet(" - "),
				carry
			});
		}
	}
	{
		const jobLogger = logger.bullet(" + ");
		for (let jid = 0; jid < jobs.length; jid++) {
			const [input, output] = jobs[jid];
			const hintStore = await hintFont(passes, {
				round: 0,
				fontIndex: jid,
				totalFonts: jobs.length,
				input,
				output,
				options,
				logger: jobLogger.bullet(" - "),
				hf,
				hc,
				carry
			});
			jobLogger.log(`Saving analysis result : ${input} -> ${output}`);
			await hintStore.commitChanges();
			await hintStore.disconnect();
		}
	}

	await saveCache(logger, hc, restOptions);
}

function createHintFactory(models: IHintingModelPlugin[]): IHintFactory {
	const hfs: IHintFactory[] = [];
	for (const plugin of models) {
		for (const hf of plugin.factoriesOfUsedHints) {
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
	try {
		await hc.load(input);
	} catch (e) {
		logger.bullet(` ! `).log(`Cache reading failed. Start with new cache.`);
		hc.clear();
	}
}
async function saveCache(logger: ILogger, hc: HintCache, hro: HintRestOptions) {
	if (!hro.cacheFilePath) return;
	logger.bullet(` + `).log(`Saving cache -> ${hro.cacheFilePath}`);
	const output = fs.createWriteStream(hro.cacheFilePath);
	await hc.save(output);
}

interface PreHintImplState<GID> {
	round: number;
	fontIndex: number;
	totalFonts: number;
	input: string;
	output: string;
	options: HintOptions;
	logger: ILogger;
	carry: PropertyBag;
}
async function preHintFont<GID>(passes: AutoHintingPass[], st: PreHintImplState<GID>) {
	const fontSourcePlugin = getFontPlugin(st.options);
	const loader = fontSourcePlugin.createFontLoader(st.input, st.input);
	const fontSource = await loader.load();
	let tasks: ITask<unknown>[] = [];
	for (const pass of passes) {
		const hm = pass.plugin.adopt(fontSource, pass.parameters);
		const pluginRounds = pass.plugin.requiredPreHintRounds || 0;
		if (!hm || !hm.getPreTask || st.round >= pluginRounds) continue;
		const task = hm.getPreTask({
			round: st.round,
			fontIndex: st.fontIndex,
			totalFonts: st.totalFonts,
			passUniqueID: pass.uniqueID,
			carry: st.carry
		});
		if (!task) continue;
		tasks.push(task);
	}

	await startTasks<GID>(st, `Pre-analyzing`, tasks);
}
async function startTasks<GID>(st: PreHintImplState<GID>, prefix: string, tasks: ITask<unknown>[]) {
	if (!tasks.length) return;
	const capacity = st.options.jobs || 1;
	st.logger.log(`${prefix} ${st.input} with ${capacity} threads...`);
	const progress = new Progress(`${prefix} ${st.input}`, st.logger);

	const host = new Host(capacity, st.options);
	const arb = new Arbitrator(capacity <= 1, host, progress);
	await Promise.all(tasks.map(task => arb.demand(task)));
}

interface HintImplState<GID> extends PreHintImplState<GID> {
	hf: IHintFactory;
	hc: HintCache;
}

async function hintFont<GID>(passes: AutoHintingPass[], st: HintImplState<GID>) {
	const fontSourcePlugin = getFontPlugin(st.options);
	const loader = fontSourcePlugin.createFontLoader(st.input, st.input);
	const fontSource = await loader.load();

	let tasks: ITask<unknown>[] = [];
	let localHintStores: IHintStore[] = [];
	for (const pass of passes) {
		const hm = pass.plugin.adopt(fontSource, pass.parameters);
		if (!hm) continue;
		const hs = new MemoryHintStore();
		if (!hs) continue;

		localHintStores.push(hs);
		const task = hm.getHintingTask({
			fontIndex: st.fontIndex,
			totalFonts: st.totalFonts,
			passUniqueID: pass.uniqueID,
			hintFactory: st.hf,
			modelLocalHintStore: hs,
			cacheManager: st.hc,
			carry: st.carry
		});
		if (!task) continue;
		tasks.push(task);
	}

	await startTasks<GID>(st, `Analyzing`, tasks);

	const hsProvider = getHintStoreProvider(st.options);
	const hsAll = await hsProvider.connectWrite(
		st.output,
		passes.map(p => p.plugin)
	);
	for (const store of localHintStores) await combineHintStore(store, hsAll);
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
