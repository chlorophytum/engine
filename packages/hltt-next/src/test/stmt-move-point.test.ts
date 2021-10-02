import { glyphPoint, twilightPoint, volatile } from "@chlorophytum/hltt-next-expr";
import { Ip, Mdap, Mdrp } from "@chlorophytum/hltt-next-stmt";
import test from "ava";

import { Func } from "../edsl/lib-system/programs";

import { StmtTestLoop } from "./-stmt-test-loop";

test("Stmt: MDAP 1", t => {
	const f1 = Func();
	f1.def(function* ($) {
		yield Mdap(glyphPoint(1));
		yield Mdap(glyphPoint(2));
		yield Mdap(twilightPoint(3));
	});
	StmtTestLoop(
		t,
		f1,
		`
            PUSHB_2 1 1
            SZP0
            MDAP_noRnd
			PUSHB_1 2
            MDAP_noRnd
			PUSHB_2 3 0
            SZP0
            MDAP_noRnd
        `
	);
});

test("Stmt: MDRP", t => {
	const f1 = Func();
	f1.def(function* ($) {
		yield Mdrp(glyphPoint(1), glyphPoint(2));
		yield Mdrp(glyphPoint(1), glyphPoint(3));
		yield Mdrp(volatile(glyphPoint(1)), volatile(glyphPoint(3)));
	});
	StmtTestLoop(
		t,
		f1,
		`
            PUSHB_4 2 1 1 1
            SRP0
            SZP0
            SZP1
            MDRP_grey
			PUSHB_1 3
            MDRP_grey
			PUSHB_2 3 1
            SRP0
            MDRP_grey
        `
	);
});

test("Stmt: IP", t => {
	const f1 = Func();
	f1.def(function* ($) {
		yield Ip(glyphPoint(1), glyphPoint(2), [glyphPoint(3), twilightPoint(4), twilightPoint(5)]);
	});
	StmtTestLoop(
		t,
		f1,
		`
		NPUSHB 10 4 5 0 2 3 1 1 2 1 1
		SRP1
		SZP0
		SRP2
		SZP1
		SZP2
		IP
		SLOOP
		SZP2
		IP
        `
	);
});
