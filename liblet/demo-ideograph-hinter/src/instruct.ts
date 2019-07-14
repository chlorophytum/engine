import { EmptyImpl, HintMain, IFinalHintSession } from "@chlorophytum/arch";
import * as Hltt from "@chlorophytum/final-hint-format-hltt";
import * as Ideograph from "@chlorophytum/ideograph-shape-analyzer-1";
import * as fs from "fs";
import * as stream from "stream";

import { Otd } from "./otd-font-format";

interface ExportPlan {
	to: stream.Writable;
	session: IFinalHintSession;
}

const PLUGINS = [Ideograph.HintingModelPlugin, EmptyImpl.EmptyHintingModelFactory];

async function main() {
	const ttCol = Hltt.FinalHintPlugin.createFinalHintCollector();
	const exportPlans: ExportPlan[] = [];

	for (let j = 2; j < process.argv.length; j++) {
		const gzHsStream = fs.createReadStream(process.argv[j]);
		const gzFhStream = fs.createWriteStream(process.argv[++j]);
		const hs = await Otd.createHintStore(gzHsStream, PLUGINS);
		const ttSession = ttCol.createSession();
		await HintMain.midHint(hs, ttSession);
		ttSession.consolidate();
		exportPlans.push({ to: gzFhStream, session: ttSession });
	}
	ttCol.consolidate();
	for (const plan of exportPlans) {
		await Otd.saveFinalHint(ttCol, plan.session, plan.to);
	}
}

main().catch(e => console.error(e));
