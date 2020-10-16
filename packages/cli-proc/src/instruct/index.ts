import {
	ConsoleLogger,
	IFinalHintCollector,
	IFinalHintFormat,
	IFinalHintSession,
	IFontFormat,
	IHintingPass,
	IHintStoreProvider,
	ILogger
} from "@chlorophytum/arch";
import { getFontPlugin, getHintingPasses, getHintStoreProvider, ProcOptions } from "../env";
import { mainMidHint } from "./procs";

interface ExportPlan {
	fromPath: string;
	toPath: string;
	session: IFinalHintSession;
}
export type InstructJob = [string, string, string];
export async function doInstruct(options: ProcOptions, jobs: InstructJob[]) {
	const FontFormat = await getFontPlugin(options);
	const HintStoreProvider = await getHintStoreProvider(options);
	const FinalHintFormat = await FontFormat.getFinalHintFormat();
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
	const preStatSink = await doPreStat(logger.bullet(" + "), FontFormat, FinalHintFormat, jobs);

	// Instruct
	const ttCol = await FinalHintFormat.createFinalHintCollector(preStatSink);
	const exportPlans = await doInstructImpl(
		logger.bullet(" + "),
		HintStoreProvider,
		FontFormat,
		ttCol,
		pass,
		jobs
	);

	// Save
	ttCol.consolidate();
	await saveInstructions(logger.bullet(" + "), FontFormat, ttCol, exportPlans);
}

async function doPreStat(
	logger: ILogger,
	FontFormat: IFontFormat,
	FinalHintFormat: IFinalHintFormat,
	jobs: [string, string, string][]
) {
	const preStatSink = await FinalHintFormat.createPreStatSink();
	const preStatAnalyzer = await FontFormat.createPreStatAnalyzer(preStatSink);
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
	FontFormat: IFontFormat,
	ttCol: IFinalHintCollector,
	pass: IHintingPass,
	jobs: [string, string, string][]
) {
	const exportPlans: ExportPlan[] = [];
	for (const [font, input, output] of jobs) {
		logger.log(`Compiling hints ${input}`);
		const ttSessionConn = await FontFormat.createFinalHintSessionConnection(ttCol);
		if (!ttSessionConn) throw new TypeError(`Final hint format not supported by font.`);
		const ttSession = await ttSessionConn.connectFont(font);
		if (!ttSession) throw new TypeError(`Final hint format not supported by font.`);
		await readHintsToSession(provider, ttSession, input, pass);
		exportPlans.push({ fromPath: font, toPath: output, session: ttSession });
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
	FontFormatPlugin: IFontFormat,
	ttCol: IFinalHintCollector,
	exportPlans: ExportPlan[]
) {
	for (const plan of exportPlans) {
		logger.log(`Instructing -> ${plan.toPath}`);
		const integrator = await FontFormatPlugin.createFinalHintIntegrator(plan.fromPath);
		await integrator.apply(ttCol, plan.session);
		await integrator.save(plan.toPath);
	}
}
