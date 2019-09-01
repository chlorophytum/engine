import {
	IFinalHintCollector,
	IFinalHintPlugin,
	IFinalHintPreStatSink,
	IFinalHintSession,
	IFontFormatPlugin,
	IHintingModelPlugin
} from "@chlorophytum/arch";
import * as Procs from "@chlorophytum/procs";
import * as fs from "fs";
import * as stream from "stream";

import { getFinalHintPlugin, getFontPlugin, getHintingPasses, HintOptions } from "./env";

interface ExportPlan {
	to: stream.Writable;
	session: IFinalHintSession;
}

export async function doInstruct(options: HintOptions, jobs: [string, string, string][]) {
	const FontFormatPlugin = getFontPlugin(options);
	const FinalHintPlugin = getFinalHintPlugin(options);
	const passes = getHintingPasses(options);
	const models = Array.from(new Set(passes.map(p => p.plugin)));

	// Pre-stat
	const preStatSink = await doPreStat(FontFormatPlugin, FinalHintPlugin, jobs);

	// Instruct
	const ttCol = FinalHintPlugin.createFinalHintCollector(preStatSink);
	const exportPlans = await doInstructImpl(FontFormatPlugin, ttCol, models, jobs);

	// Save
	ttCol.consolidate();
	await saveInstructions(FontFormatPlugin, ttCol, exportPlans);
}

async function doPreStat(
	FontFormatPlugin: IFontFormatPlugin,
	FinalHintPlugin: IFinalHintPlugin,
	jobs: [string, string, string][]
) {
	const preStatSink = FinalHintPlugin.createPreStatSink();
	const preStatAnalyzer = FontFormatPlugin.createPreStatAnalyzer(preStatSink);
	if (!preStatAnalyzer) throw new TypeError(`Final hint format not supported by font.`);
	for (const [font, input, output] of jobs) {
		await preStatAnalyzer.analyzeFontPreStat(fs.createReadStream(font));
	}
	return preStatSink;
}
async function doInstructImpl(
	FontFormatPlugin: IFontFormatPlugin,
	ttCol: IFinalHintCollector,
	models: IHintingModelPlugin[],
	jobs: [string, string, string][]
) {
	const exportPlans: ExportPlan[] = [];
	for (const [font, input, output] of jobs) {
		const gzHsStream = fs.createReadStream(input);
		const gzFhStream = fs.createWriteStream(output);
		const hs = await FontFormatPlugin.createHintStore(gzHsStream, models);
		const ttSession = ttCol.createSession();
		await Procs.mainMidHint(hs, ttSession);
		ttSession.consolidate();
		exportPlans.push({ to: gzFhStream, session: ttSession });
	}
	return exportPlans;
}

async function saveInstructions(
	FontFormatPlugin: IFontFormatPlugin,
	ttCol: IFinalHintCollector,
	exportPlans: ExportPlan[]
) {
	const saver = FontFormatPlugin.createFinalHintSaver(ttCol);
	if (!saver) throw new TypeError(`Final hint format not supported by font.`);
	for (const plan of exportPlans) {
		await saver.saveFinalHint(plan.session, plan.to);
	}
}
