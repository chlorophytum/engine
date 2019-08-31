import { IFinalHintSession } from "@chlorophytum/arch";
import * as Procs from "@chlorophytum/procs";
import * as fs from "fs";
import * as stream from "stream";

import { getFinalHintPlugin, getFontPlugin, getHintingPasses, HintOptions } from "./env";

interface ExportPlan {
	to: stream.Writable;
	session: IFinalHintSession;
}

export async function doInstruct(options: HintOptions, jobs: [string, string][]) {
	const FontFormatPlugin = getFontPlugin(options);
	const FinalHintPlugin = getFinalHintPlugin(options);
	const passes = getHintingPasses(options);
	const models = Array.from(new Set(passes.map(p => p.plugin)));
	const ttCol = FinalHintPlugin.createFinalHintCollector();
	const exportPlans: ExportPlan[] = [];

	for (const [input, output] of jobs) {
		const gzHsStream = fs.createReadStream(input);
		const gzFhStream = fs.createWriteStream(output);
		const hs = await FontFormatPlugin.createHintStore(gzHsStream, models);
		const ttSession = ttCol.createSession();
		await Procs.mainMidHint(hs, ttSession);
		ttSession.consolidate();
		exportPlans.push({ to: gzFhStream, session: ttSession });
	}

	ttCol.consolidate();
	const saver = FontFormatPlugin.createFinalHintSaver();
	for (const plan of exportPlans) {
		await saver.saveFinalHint(ttCol, plan.session, plan.to);
	}
}
