import {
	ConsoleLogger,
	IFinalHintCollector,
	IFinalHintPlugin,
	IFinalHintSession,
	IFontFormatPlugin,
	IHintingModelPlugin,
	ILogger
} from "@chlorophytum/arch";
import * as fs from "fs";

import { getFinalHintPlugin, getFontPlugin, getHintingPasses, HintOptions } from "../env";

import { mainMidHint } from "./procs";

interface ExportPlan {
	toPath: string;
	session: IFinalHintSession;
}

export async function doInstruct(options: HintOptions, jobs: [string, string, string][]) {
	const FontFormatPlugin = getFontPlugin(options);
	const FinalHintPlugin = getFinalHintPlugin(options);
	const passes = getHintingPasses(options);
	const models = Array.from(new Set(passes.map(p => p.plugin)));

	const logger = new ConsoleLogger();
	logger.log("Instruction Generation");

	{
		const briefLogger = logger.bullet(" * ");
		for (const [font, input, output] of jobs) {
			briefLogger.log(`Job: ${font} | ${input} -> ${output}`);
		}
	}

	// Pre-stat
	const preStatSink = await doPreStat(
		logger.bullet(" + "),
		FontFormatPlugin,
		FinalHintPlugin,
		jobs
	);

	// Instruct
	const ttCol = FinalHintPlugin.createFinalHintCollector(preStatSink);
	const exportPlans = await doInstructImpl(
		logger.bullet(" + "),
		FontFormatPlugin,
		ttCol,
		models,
		jobs
	);

	// Save
	ttCol.consolidate();
	await saveInstructions(logger.bullet(" + "), FontFormatPlugin, ttCol, exportPlans);
}

async function doPreStat(
	logger: ILogger,
	FontFormatPlugin: IFontFormatPlugin,
	FinalHintPlugin: IFinalHintPlugin,
	jobs: [string, string, string][]
) {
	const preStatSink = FinalHintPlugin.createPreStatSink();
	const preStatAnalyzer = FontFormatPlugin.createPreStatAnalyzer(preStatSink);
	if (!preStatAnalyzer) throw new TypeError(`Final hint format not supported by font.`);
	for (const [font, input, output] of jobs) {
		logger.log(`Pre-stating ${font}`);
		await preStatAnalyzer.analyzeFontPreStat(fs.createReadStream(font));
	}
	return preStatSink;
}
async function doInstructImpl(
	logger: ILogger,
	FontFormatPlugin: IFontFormatPlugin,
	ttCol: IFinalHintCollector,
	models: IHintingModelPlugin[],
	jobs: [string, string, string][]
) {
	const exportPlans: ExportPlan[] = [];
	for (const [font, input, output] of jobs) {
		logger.log(`Instructing ${input}`);
		const gzHsStream = fs.createReadStream(input);
		const ttSession = ttCol.createSession();
		await readHintsToSession(FontFormatPlugin, ttSession, gzHsStream, models);
		exportPlans.push({ toPath: output, session: ttSession });
	}
	return exportPlans;
}

async function readHintsToSession(
	FontFormatPlugin: IFontFormatPlugin,
	ttSession: IFinalHintSession,
	gzHsStream: fs.ReadStream,
	models: IHintingModelPlugin[]
) {
	const hs = await FontFormatPlugin.createHintStore(gzHsStream, models);
	await mainMidHint(hs, ttSession);
	ttSession.consolidate();
}

async function saveInstructions(
	logger: ILogger,
	FontFormatPlugin: IFontFormatPlugin,
	ttCol: IFinalHintCollector,
	exportPlans: ExportPlan[]
) {
	const saver = FontFormatPlugin.createFinalHintSaver(ttCol);
	if (!saver) throw new TypeError(`Final hint format not supported by font.`);
	for (const plan of exportPlans) {
		logger.log(`Saving instructions -> ${plan.toPath}`);
		await saver.saveFinalHint(plan.session, fs.createWriteStream(plan.toPath));
	}
}
