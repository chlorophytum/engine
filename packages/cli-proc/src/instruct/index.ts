import {
	ConsoleLogger,
	IFinalHintSink,
	IFinalHintSinkSession,
	IFinalHintStore,
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
	session: IFinalHintSinkSession;
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
	const fhSink = await FinalHintFormat.createFinalHintSink();

	await doPreStat(logger.bullet(" + "), FontFormat, fhSink, jobs);

	// Instruct
	const exportPlans = await doInstructImpl(
		logger.bullet(" + "),
		HintStoreProvider,
		fhSink,
		pass,
		jobs
	);

	// Save
	const fhSource = await fhSink.consolidate();
	await saveInstructions(logger.bullet(" + "), FontFormat, fhSource, exportPlans);
}

async function doPreStat(
	logger: ILogger,
	FontFormat: IFontFormat,
	sink: IFinalHintSink,
	jobs: [string, string, string][]
) {
	for (const [font, input, output] of jobs) {
		logger.log(`Pre-stating ${font}`);
		const fontConn = await FontFormat.connectFont(font, font);
		if (!fontConn) throw new Error(`Unable to connect to font ${font}`);
		const preStatAnalyzer = await fontConn.openPreStat(sink);
		if (!preStatAnalyzer) throw new TypeError(`Final hint format not supported by font.`);
		await preStatAnalyzer.preStat();
	}
	return sink;
}
async function doInstructImpl(
	logger: ILogger,
	hsProvider: IHintStoreProvider,
	ttCol: IFinalHintSink,
	pass: IHintingPass,
	jobs: [string, string, string][]
) {
	const exportPlans: ExportPlan[] = [];
	for (const [font, input, output] of jobs) {
		logger.log(`Compiling hints ${input}`);
		const fhSession = await ttCol.createSession(font, input, output);
		await readHintsToSession(hsProvider, fhSession, font, input, pass);
		exportPlans.push({ fromPath: font, toPath: output, session: fhSession });
	}
	return exportPlans;
}

async function readHintsToSession(
	provider: IHintStoreProvider,
	ttSession: IFinalHintSinkSession,
	font: string,
	input: string,
	pass: IHintingPass
) {
	const hs = await provider.connectRead(input, pass, font);
	await mainMidHint(hs, ttSession);
	ttSession.consolidate();
	await hs.disconnect();
}

async function saveInstructions(
	logger: ILogger,
	FontFormat: IFontFormat,
	fhSource: IFinalHintStore,
	exportPlans: ExportPlan[]
) {
	for (const plan of exportPlans) {
		logger.log(`Instructing -> ${plan.toPath}`);
		const fontConn = await FontFormat.connectFont(plan.fromPath, plan.fromPath);
		if (!fontConn) throw new Error(`Unable to connect to font ${plan.fromPath}`);
		const integrator = await fontConn.openFinalHintIntegrator();
		if (!integrator) throw new Error(`Unable to connect to font ${plan.fromPath}`);
		await integrator.apply(fhSource, plan.session);
		await integrator.save(plan.toPath);
	}
}
