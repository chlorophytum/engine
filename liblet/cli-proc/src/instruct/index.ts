import {
	ConsoleLogger,
	IFinalHintCollector,
	IFinalHintPlugin,
	IFinalHintSession,
	IFontFormatPlugin,
	IHintingPass,
	IHintStoreProvider,
	ILogger
} from "@chlorophytum/arch";

import {
	getFinalHintPlugin,
	getFontPlugin,
	getHintingPasses,
	getHintStoreProvider,
	ProcOptions
} from "../env";

import { mainMidHint } from "./procs";

interface ExportPlan {
	toPath: string;
	session: IFinalHintSession;
}
export type InstructJob = [string, string, string];
export async function doInstruct(options: ProcOptions, jobs: InstructJob[]) {
	const FontFormatPlugin = getFontPlugin(options);
	const HintStoreProvider = getHintStoreProvider(options);
	const FinalHintPlugin = getFinalHintPlugin(options);
	const pass = await getHintingPasses(options);

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
	const ttCol = await FinalHintPlugin.createFinalHintCollector(preStatSink);
	const exportPlans = await doInstructImpl(
		logger.bullet(" + "),
		HintStoreProvider,
		FontFormatPlugin,
		ttCol,
		pass,
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
	const preStatSink = await FinalHintPlugin.createPreStatSink();
	const preStatAnalyzer = await FontFormatPlugin.createPreStatAnalyzer(preStatSink);
	if (!preStatAnalyzer) throw new TypeError(`Final hint format not supported by font.`);
	for (const [font, input, output] of jobs) {
		logger.log(`Pre-stating ${font}`);
		await preStatAnalyzer.analyzeFontPreStat(font);
	}
	return preStatSink;
}
async function doInstructImpl(
	logger: ILogger,
	provider: IHintStoreProvider,
	FontFormatPlugin: IFontFormatPlugin,
	ttCol: IFinalHintCollector,
	pass: IHintingPass,
	jobs: [string, string, string][]
) {
	const exportPlans: ExportPlan[] = [];
	for (const [font, input, output] of jobs) {
		logger.log(`Instructing ${input}`);
		const ttSessionConn = await FontFormatPlugin.createFinalHintSessionConnection(ttCol);
		if (!ttSessionConn) throw new TypeError(`Final hint format not supported by font.`);
		const ttSession = await ttSessionConn.connectFont(font);
		if (!ttSession) throw new TypeError(`Final hint format not supported by font.`);
		await readHintsToSession(provider, ttSession, input, pass);
		exportPlans.push({ toPath: output, session: ttSession });
	}
	return exportPlans;
}

async function readHintsToSession(
	provider: IHintStoreProvider,
	ttSession: IFinalHintSession,
	input: string,
	pass: IHintingPass
) {
	const hs = await provider.connectRead(input, pass);
	await mainMidHint(hs, ttSession);
	ttSession.consolidate();
	await hs.disconnect();
}

async function saveInstructions(
	logger: ILogger,
	FontFormatPlugin: IFontFormatPlugin,
	ttCol: IFinalHintCollector,
	exportPlans: ExportPlan[]
) {
	const saver = await FontFormatPlugin.createFinalHintSaver(ttCol);
	if (!saver) throw new TypeError(`Final hint format not supported by font.`);
	for (const plan of exportPlans) {
		logger.log(`Saving instructions -> ${plan.toPath}`);
		await saver.saveFinalHint(plan.session, plan.toPath);
	}
}
