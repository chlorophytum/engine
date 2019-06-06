import { FontForgeTextInstr } from "@chlorophytum/fontforge-instr";
import {
	createHintingStrategy,
	createHints,
	createSharedHints
} from "@chlorophytum/ideograph-shape-analyzer-1";
import { HlttSink } from "@chlorophytum/sink-hltt";
import * as fs from "fs";

const otd = JSON.parse(fs.readFileSync(process.argv[2], "utf-8"));
const params = createHintingStrategy();
const tt = new HlttSink();

for (const c in otd.cmap) {
	const gid = otd.cmap[c];
	if (otd.glyf[gid] && otd.glyf[gid].contours) {
		const programSink = tt.createGlyphProgramSink(gid);
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
	const programSink = tt.createSharedProgramSink("Ideographs");
	const compiler = prepHints.createCompiler(programSink);
	if (compiler) {
		compiler.doCompile();
		programSink.save();
	}
	tt.consolidatePreProgram();
}

const fpgmResults = tt.edsl.compileFunctions(FontForgeTextInstr);
otd.fpgm = [];
for (const [k, v] of fpgmResults) otd.fpgm.push(v);

otd.prep = [];
if (tt.preProgram) otd.prep = [tt.edsl.compileProgram(tt.preProgram, FontForgeTextInstr)];

for (let gid in otd.glyf) {
	const glyphProgram = tt.glyphPrograms.get(gid);
	if (glyphProgram) {
		otd.glyf[gid].instructions = [tt.edsl.compileProgram(glyphProgram, FontForgeTextInstr)];
	} else {
		otd.glyf[gid].instructions = [];
	}
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
otd.TSI_01 = otd.TSI_23 = null;

fs.writeFileSync(process.argv[3], JSON.stringify(otd, undefined, "\t"));
