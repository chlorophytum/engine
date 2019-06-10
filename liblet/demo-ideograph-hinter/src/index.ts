import { FontForgeTextInstr } from "@chlorophytum/fontforge-instr";
import {
	createHintingStrategy,
	createHints,
	createSharedHints
} from "@chlorophytum/ideograph-shape-analyzer-1";
import { HlttCollector } from "@chlorophytum/sink-hltt";
import * as fs from "fs";

const otd = JSON.parse(fs.readFileSync(process.argv[2], "utf-8"));
const params = createHintingStrategy(JSON.parse(fs.readFileSync(process.argv[3], "utf-8")));
const ttCol = new HlttCollector();
const ttSession = ttCol.createSession();

for (const c in otd.cmap) {
	const gid = otd.cmap[c];
	if (otd.glyf[gid] && otd.glyf[gid].contours) {
		const programSink = ttSession.createGlyphProgramSink(gid);
		const hints = createHints(otd.glyf[gid].contours, params);
		const compiler = hints.createCompiler(programSink);
		if (compiler) {
			compiler.doCompile();
			programSink.save();
			console.log("Analyzed", gid);
		}
	}
}

{
	const prepHints = createSharedHints(params);
	const programSink = ttSession.createSharedProgramSink("Ideographs");
	const compiler = prepHints.createCompiler(programSink);
	if (compiler) {
		compiler.doCompile();
		programSink.save();
	}
	ttSession.consolidatePreProgram();
}

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
