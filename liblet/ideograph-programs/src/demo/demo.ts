import { FontForgeTextInstr } from "@chlorophytum/fontforge-instr";
import HLTT, { initStdLib, ProgramDsl } from "@chlorophytum/hltt";
import * as fs from "fs";

import { InitEmBox, PSetupEmBox } from "../em-box";
import { THintMultipleStrokes } from "../middle";
import { THintBottomEdge, THintBottomStroke, THintTopEdge, THintTopStroke } from "../top-bottom";

const dsl = HLTT();
initStdLib(dsl);

const progA = dsl.program(function*(e) {
	yield e.svtca.y();
	yield e.call(InitEmBox);
	yield e.call(THintBottomEdge, ~0, ~1, 0);
	yield e.call(THintBottomEdge, ~0, ~1, 19);
	yield e.call(THintTopEdge, ~0, ~1, 71);
	yield e.call(THintTopStroke, ~0, 71, 39, 38);

	yield e.call(
		THintMultipleStrokes(3, [1, 1, 1, 1], [1, 1, 1]),
		...[19, 71],
		...[59, 61, 29, 30, 64, 54]
	);
	yield e.call(THintMultipleStrokes(1, [1, 0], [1]), ...[30, 39], ...[34, 36]);
	yield e.call(
		THintMultipleStrokes(3, [1, 1, 1, 1], [1, 1, 1]),
		...[0, 71],
		...[9, 11, 2, 3, 86, 87]
	);

	yield* simpleLink(e, 30, 42);
	yield* simpleLink(e, 29, 45);
	yield* simpleLink(e, 2, 17);
	yield e.ip(19, 59, 53, 57);
	yield e.ip(3, 71, 65, 78);
	yield e.ip(34, 39, 32, 41);

	yield e.iup.x();
	yield e.iup.y();
});

const progB = dsl.program(function*(e) {
	yield e.svtca.y();
	yield e.call(InitEmBox);

	yield e.call(THintBottomStroke, ~2, ~3, 28, 30);
	yield e.call(THintBottomEdge, ~0, ~1, 14);
	yield e.call(THintTopStroke, ~2, ~3, 48, 21);
	yield e.call(THintTopStroke, ~0, 21, 13, 1);
	yield e.call(THintMultipleStrokes(2, [1, 1, 1], [1, 1]), ...[30, 48], ...[37, 39, 42, 45]);
	yield e.call(THintMultipleStrokes(2, [1, 1, 1], [1, 1]), ...[30, 13], ...[4, 6, 9, 10]);
	yield e.iup.x();
	yield e.iup.y();
});

const progC = dsl.program(function*(e) {
	yield e.svtca.y();
	yield e.call(InitEmBox);

	yield e.call(THintBottomStroke, ~2, ~3, 16, 17);
	yield e.call(THintBottomStroke, ~2, ~3, 14, 37);
	yield e.call(THintBottomEdge, ~0, ~1, 15);
	yield e.call(THintTopStroke, ~2, ~3, 4, 5);
	yield e.call(THintBottomEdge, ~0, ~1, 12);
	yield e.call(THintTopEdge, ~0, ~1, 78);
	yield e.call(
		THintMultipleStrokes(
			6,
			[1, 1, 1, 1, 1, 1, 1],
			[1, 1, 1, 1, 1, 1],
			[0, 0, 2, -3, -1, -1, 0]
		),
		...[17, 78],
		...[22, 41, 44, 23, 64, 65, 75, 87, 90, 103, 106, 76]
	);

	yield e.call(
		THintMultipleStrokes(3, [1, 1, 1, 1], [1, 0, 1]),
		37,
		4,
		...[40, 45, 48, 68, 63, 1]
	);
	yield e.call(THintMultipleStrokes(1, [1, 1], [1]), 37, 4, 63, 1);
	yield e.call(THintMultipleStrokes(2, [1, 1, 1], [1, 1]), 37, 63, ...[40, 45, 48, 68]);
	yield e.mdrp.rp0(17, 31);
	yield e.mdrp.rp0(31, 28);
	yield e.mdrp.rp0(22, 35);
	yield e.mdrp.rp0(35, 26);
	yield e.mdrp.rp0(87, 91);
	yield e.mdrp.rp0(91, 95);
	yield e.mdrp.rp0(90, 94);
	yield e.mdrp.rp0(94, 98);
	yield e.mdrp.rp0(103, 107);
	yield e.mdrp.rp0(107, 111);
	yield e.mdrp.rp0(106, 110);
	yield e.mdrp.rp0(110, 114);
	yield e.mdrp.rp0(76, 80);
	yield e.mdrp.rp0(80, 84);
	yield e.mdrp.rp0(78, 82);
	yield e.mdrp.rp0(63, 53);
	yield e.mdrp.rp0(53, 72);
	yield e.mdrp.rp0(1, 99);
	yield e.mdrp.rp0(99, 9);
	yield e.mdrp.rp0(4, 102);
	yield e.mdrp.rp0(102, 8);
	yield e.ip(45, 63, 58, 59, 56);
	yield e.iup.x();
	yield e.iup.y();
});

function* simpleLink(e: ProgramDsl, ...zs: number[]) {
	for (let j = 1; j < zs.length; j++) {
		yield e.mdrp.rp0(zs[j - 1], zs[j]);
	}
}

const progD = dsl.program(function*(e) {
	yield e.svtca.y();
	yield e.call(InitEmBox);

	yield e.call(THintTopEdge, ~0, ~1, 118);
	yield e.call(THintBottomEdge, ~0, ~1, 0);
	yield e.call(THintTopStroke, ~2, ~3, 85, 60);

	yield e.call(THintMultipleStrokes(2, [1, 1, 1], [1, 1]), ...[0, 85], ...[25, 24, 7, 8]);
	yield e.call(THintMultipleStrokes(1, [1, 1], [1]), 0, 7, 3, 4);
	yield e.call(
		THintMultipleStrokes(2, [1, 1, 1], [1, 1], [0, 1, 0]),
		...[24, 7],
		...[32, 33, 36, 37]
	);
	yield e.call(THintMultipleStrokes(1, [1, 1], [1]), 8, 85, 52, 87);
	yield e.call(THintMultipleStrokes(1, [1, 1], [1]), 87, 85, 80, 65);
	yield e.call(
		THintMultipleStrokes(4, [1, 1, 1, 1, 1], [1, 1, 1, 1], [0, -1, 3, 2, 0]),
		8,
		118,
		17,
		96,
		99,
		14,
		111,
		112,
		115,
		116
	);
	yield e.ip(3, 25, 1, 26);
	yield e.ip(4, 24, 5, 28, 30, 23);
	yield e.ip(8, 52, 45, 41, 109, 43, 106, 49, 92);
	yield* simpleLink(e, 8, 19);
	yield* simpleLink(e, 7, 40, 22);
	yield* simpleLink(e, 99, 105);
	yield* simpleLink(e, 96, 102);
	yield* simpleLink(e, 112, 124);
	yield* simpleLink(e, 115, 123);
	yield* simpleLink(e, 116, 120);

	yield e.iup.x();
	yield e.iup.y();
});

const progE = dsl.program(function*(e) {
	yield e.svtca.y();
	yield e.call(InitEmBox);

	yield e.call(THintBottomStroke, ~2, ~3, 0, 1);
	yield e.call(THintTopEdge, ~0, ~1, 91);

	yield e.call(
		THintMultipleStrokes(3, [1, 1, 1, 1], [1, 1, 1]),
		...[1, 91],
		...[61, 21, 66, 39, 86, 87]
	);
	yield e.call(THintTopStroke, ...[21, 39], ...[52, 53]);
	yield e.call(THintMultipleStrokes(1, [1, 1], [1]), ...[21, 86], ...[79, 81]);
	yield e.call(
		THintMultipleStrokes(3, [1, 1, 1, 1], [1, 1, 1], [0, 2, 1, 3]),
		...[1, 61],
		...[11, 12, 15, 16, 19, 3]
	);
	yield e.call(
		THintMultipleStrokes(2, [1, 1, 1], [1, 1], [0, 1]),
		...[21, 52],
		...[44, 45, 48, 49]
	);
	yield e.call(
		THintMultipleStrokes(2, [1, 1, 1], [1, 1], [0, 1]),
		...[21, 52],
		...[36, 33, 32, 29]
	);
	yield e.call(
		THintMultipleStrokes(3, [1, 1, 1, 1], [1, 1, 1], [3, 1, 2, 0]),
		...[21, 66],
		...[67, 71, 74, 68, 75, 76]
	);

	yield* simpleLink(e, 86, 109, 96);
	yield* simpleLink(e, 87, 93);
	yield* simpleLink(e, 1, 8, 5);
	yield* simpleLink(e, 21, 37, 63, 41, 56);
	yield* simpleLink(e, 79, 102);
	yield* simpleLink(e, 81, 100);
	yield e.ip(79, 86, 104, 106, 83, 98);

	yield e.iup.x();
	yield e.iup.y();
});
const progF = dsl.program(function*(e) {
	yield e.svtca.y();
	yield e.call(InitEmBox);

	yield e.call(THintBottomStroke, ~2, ~3, 4, 5);
	yield e.call(THintTopStroke, ~2, ~3, 75, 65);

	yield e.call(THintMultipleStrokes(1, [1, 1], [1]), ...[5, 75], ...[36, 37]);

	yield e.call(
		THintMultipleStrokes(
			8,
			[1, 1, 1, 1, 1, 1, 1, 1, 1],
			[1, 1, 1, 1, 1, 1, 1, 1],
			[0, -1, -7, -8, -2, 0, -5, -1, 0]
		),
		...[5, 75],
		...[9, 10, 24, 25, 52, 53, 56, 57, 30, 33, 36, 37, 64, 68, 71, 72]
	);
	yield e.call(THintMultipleStrokes(1, [0, 1], [1]), 4, 9, 2, 18);

	yield e.mdrp.rp0(36, 40);
	yield e.mdrp.rp0(33, 41);
	yield e.mdrp.rp0(30, 46);
	yield e.mdrp.rp0(9, 22);
	yield e.mdrp.rp0(22, 13);
	yield e.mdrp.rp0(56, 60);
	yield e.mdrp.rp0(57, 61);
	yield e.mdrp.rp0(52, 48);
	yield e.mdrp.rp0(53, 49);
	yield e.ip(4, 9, 2);
	yield e.ip(5, 9, 6, 16, 18);
	yield e.ip(~0, 4, 0);

	yield e.iup.x();
	yield e.iup.y();
});

const progG = dsl.program(function*(e) {
	yield e.svtca.y();
	yield e.call(InitEmBox);

	yield e.call(THintBottomStroke, ~2, ~3, 0, 9);
	yield e.call(THintTopEdge, ~0, ~1, 59);
	yield e.call(THintTopEdge, ~0, ~1, 98);
	yield e.call(THintTopStroke, ~2, ~3, 170, 171);

	yield e.call(THintMultipleStrokes(1, [1, 1], [1]), 9, 170, ...[140, 154]);
	yield e.call(
		THintMultipleStrokes(4, [1, 1, 1, 1, 1], [1, 1, 1, 1], [0, 1, 3, 2]),
		154,
		170,
		...[157, 135, 158, 159, 162, 163, 166, 167]
	);

	yield e.ip(9, 140, 134, 138, 40, 35);
	yield e.ip(0, 140, 19, 22, 25, 30);
	yield e.ip(0, 59, 45, 81, 120, 124, 148, 151, 127, 131, 142, 145);

	yield e.iup.x();
	yield e.iup.y();
});

const prep = dsl.program(function*(e) {
	yield* PSetupEmBox(e, -0.17, 0.77, -0.135, 0.735);
});

const fns = dsl.compileFunctions(FontForgeTextInstr);

const otd = JSON.parse(fs.readFileSync(process.argv[2], "utf-8"));
otd.fpgm = [];
for (const [k, v] of fns) otd.fpgm.push(v);
otd.OS_2.usWinAscent = 1000;
otd.OS_2.usWinDescent = 600;
otd.OS_2.sTypoAscender = 1000;
otd.OS_2.sTypoDescender = -600;
otd.hhea.ascender = 1000;
otd.hhea.descender = -600;
otd.vhea.version = 1;
otd.maxp.maxFunctionDefs = 2048;
otd.maxp.maxStackElements = 2048;
otd.maxp.maxStorage = 2048;
otd.maxp.maxTwilightPoints = 256;
otd.prep = [dsl.compileProgram(prep, FontForgeTextInstr)];
for (let g in otd.glyf) otd.glyf[g].instructions = [];
otd.glyf.A.instructions = [dsl.compileProgram(progA, FontForgeTextInstr)];
otd.glyf.B.instructions = [dsl.compileProgram(progB, FontForgeTextInstr)];
otd.glyf.C.instructions = [dsl.compileProgram(progC, FontForgeTextInstr)];
otd.glyf.D.instructions = [dsl.compileProgram(progD, FontForgeTextInstr)];
otd.glyf.E.instructions = [dsl.compileProgram(progE, FontForgeTextInstr)];
otd.glyf.F.instructions = [dsl.compileProgram(progF, FontForgeTextInstr)];
otd.glyf.G.instructions = [dsl.compileProgram(progG, FontForgeTextInstr)];
otd.gasp = [
	{
		rangeMaxPPEM: 65535,
		dogray: true,
		gridfit: true,
		symmetric_smoothing: true,
		symmetric_gridfit: true
	}
];
otd.post.version = 3;
fs.writeFileSync(process.argv[3], JSON.stringify(otd));
