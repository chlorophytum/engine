import { HintMain, IFinalHintSession } from "@chlorophytum/arch";
import * as fs from "fs";
import * as stream from "stream";

import { createEnv, HintOptions } from "./env";

interface ExportPlan {
	to: stream.Writable;
	session: IFinalHintSession;
}

export async function doInstruct(options: HintOptions, jobs: [string, string][]) {
	const env = createEnv(options);
	const ttCol = env.FinalHintPlugin.createFinalHintCollector();
	const exportPlans: ExportPlan[] = [];

	for (const [input, output] of jobs) {
		const gzHsStream = fs.createReadStream(input);
		const gzFhStream = fs.createWriteStream(output);
		const hs = await env.FontFormatPlugin.createHintStore(gzHsStream, env.models);
		const ttSession = ttCol.createSession();
		await HintMain.midHint(hs, ttSession);
		ttSession.consolidate();
		exportPlans.push({ to: gzFhStream, session: ttSession });
	}

	ttCol.consolidate();
	for (const plan of exportPlans) {
		await env.FontFormatPlugin.saveFinalHint(ttCol, plan.session, plan.to);
	}
}
