import * as fs from "fs";

import {
	BuiltInCombinators,
	ConsoleLogger,
	IHintFactory,
	IHintingPass,
	IHintStore,
	ILogger,
	ITask,
	PropertyBag
} from "@chlorophytum/arch";
import { MemoryHintStore } from "@chlorophytum/hint-store-memory";

import { getFontPlugin, getHintingPasses, getHintStoreProvider, ProcOptions } from "../env";
import { Arbitrator } from "../tasks/arb";
import { Progress } from "../tasks/progress";

import { HintCache } from "./cache";
import { Host } from "./worker-host-nodejs";

export type HintOptions = ProcOptions & { cacheFilePath?: null | undefined | string };
export type HintJob = [string, string];
export async function doHint(options: HintOptions, jobs: HintJob[]) {
	const pass = await getHintingPasses(options);
	const hf = createHintFactory(pass);
	const hc = new HintCache(hf);

	const logger = new ConsoleLogger();
	logger.log("Auto hint");

	await setupCache(logger, hc, options);
	const carry = new PropertyBag();

	{
		const briefLogger = logger.bullet(" * ");
		for (const [input, output] of jobs) {
			briefLogger.log(`Job: ${input} -> ${output}`);
		}
	}
	for (let round = 0; round < pass.requirePreHintRounds; round++) {
		const jobLogger = logger.bullet(" + ");
		for (let jid = 0; jid < jobs.length; jid++) {
			const [input, output] = jobs[jid];
			await preHintFont(pass, {
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
			const hsProvider = await getHintStoreProvider(options);
			const hintStore = await hsProvider.connectWrite(output, pass, input);
			await hintFont(hintStore, pass, {
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

	await saveCache(logger, hc, options);
}

function createHintFactory(pass: IHintingPass): IHintFactory {
	return new BuiltInCombinators.FallbackHintFactory(pass.factoriesOfUsedHints);
}

async function setupCache(logger: ILogger, hc: HintCache, hro: HintOptions) {
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
async function saveCache(logger: ILogger, hc: HintCache, hro: HintOptions) {
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
	options: ProcOptions;
	logger: ILogger;
	carry: PropertyBag;
}

async function openFont<GID>(st: PreHintImplState<GID>) {
	const fontSourcePlugin = await getFontPlugin(st.options);
	const fontConn = await fontSourcePlugin.connectFont(st.input, st.input);
	if (!fontConn) throw new Error(`Unable to connect to font: ${st.input}`);
	const fontSource = await fontConn.openFontSource();
	if (!fontSource) throw new Error(`Unable to connect to font: ${st.input}`);
	return fontSource;
}

async function preHintFont<GID>(pass: IHintingPass, st: PreHintImplState<GID>) {
	const fontSource = await openFont(st);
	const hm = await pass.adopt(fontSource);
	if (!hm || !hm.getPreTask) return;
	const task = hm.getPreTask({
		round: st.round,
		fontIndex: st.fontIndex,
		totalFonts: st.totalFonts,
		carry: st.carry
	});
	if (!task) return;

	await startTasks<GID>(st, `Pre-analyzing`, [task]);
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

async function hintFont<GID>(hs: IHintStore, pass: IHintingPass, st: HintImplState<GID>) {
	const fontSource = await openFont(st);
	const hm = await pass.adopt(fontSource);
	if (!hm) return;
	const hsLocal = new MemoryHintStore();
	if (!hsLocal) return;

	const task = hm.getHintingTask({
		fontIndex: st.fontIndex,
		totalFonts: st.totalFonts,
		hintFactory: st.hf,
		hintStore: hs,
		cacheManager: st.hc,
		carry: st.carry
	});
	if (!task) return;

	await startTasks<GID>(st, `Analyzing`, [task]);
}

process.on("warning", e => console.warn(e.stack));
