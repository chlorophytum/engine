import { EmptyImpl, HintMain } from "@chlorophytum/arch";
import { FontForgeTextInstr } from "@chlorophytum/fontforge-instr";
import { hintingModel } from "@chlorophytum/ideograph-shape-analyzer-1";
import { HlttCollector } from "@chlorophytum/sink-hltt";
import * as fs from "fs";

import { OtdFontSource } from "./simple-otd-support";

async function main() {
	const otd = JSON.parse(fs.readFileSync(process.argv[2], "utf-8"));
	const fontSource = new OtdFontSource(otd);
	const hs = await HintMain.preHint(
		fontSource,
		[hintingModel, EmptyImpl.EmptyHintingModelFactory],
		[
			{ type: "Chlorophytum::EmptyHinting" },
			{
				type: "Chlorophytum::IdeographHintingModel1",
				parameters: JSON.parse(fs.readFileSync(process.argv[3], "utf-8"))
			}
		]
	);
	const ttCol = new HlttCollector();
	const ttSession = ttCol.createSession();
	await HintMain.midHint(hs, ttSession);

	ttSession.consolidatePreProgram();
	otd.fpgm = [...ttCol.getFunctionDefs(FontForgeTextInstr).values()];
	otd.prep = [ttSession.getPreProgram(FontForgeTextInstr)];
	for (let gid in otd.glyf) {
		otd.glyf[gid].instructions = [ttSession.getGlyphProgram(gid, FontForgeTextInstr)];
	}

	otd.gasp = [
		{
			rangeMaxPPEM: 65535,
			dogray: true,
			gridfit: true,
			symmetric_smoothing: true,
			symmetric_gridfit: true
		}
	];

	otd.maxp.maxFunctionDefs = 2048;
	otd.maxp.maxStackElements = 2048;
	otd.maxp.maxStorage = 2048;
	otd.maxp.maxTwilightPoints = 256;
	otd.TSI_01 = otd.TSI_23 = otd.TSI5 = null;

	fs.writeFileSync(process.argv[4], JSON.stringify(otd, undefined, "\t"));
}

main().catch(e => console.error(e));
