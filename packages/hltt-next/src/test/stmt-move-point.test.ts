import test from "ava";

import { glyphPoint, twilightPoint, volatile } from "../edsl/expr-impl/const";
import { func } from "../edsl/lib-system";
import { Ip, Mdap, Mdrp } from "../edsl/stmt-impl/move-point";

import { StmtTestLoop } from "./-stmt-test-loop";

test("TrStmt: MDAP 1", t => {
	const f1 = func();
	f1.def(function* ($) {
		yield Mdap(glyphPoint(1));
		yield Mdap(glyphPoint(2));
		yield Mdap(twilightPoint(3));
	});
	StmtTestLoop(
		t,
		f1,
		`
            PUSHB_5 3 0 2 1 1
            SZP0
            MDAP_noRnd
            MDAP_noRnd
            SZP0
            MDAP_noRnd
        `
	);
});

test("TrStmt: MDRP", t => {
	const f1 = func();
	f1.def(function* ($) {
		yield Mdrp(glyphPoint(1), glyphPoint(2));
		yield Mdrp(glyphPoint(1), glyphPoint(3));
		yield Mdrp(volatile(glyphPoint(1)), volatile(glyphPoint(3)));
	});
	StmtTestLoop(
		t,
		f1,
		`
            PUSHB_7 3 1 3 2 1 1 1
            SRP0
            SZP0
            SZP1
            MDRP_grey
            MDRP_grey
            SRP0
            MDRP_grey
        `
	);
});

test("TrStmt: IP", t => {
	const f1 = func();
	f1.def(function* ($) {
		yield Ip(glyphPoint(1), glyphPoint(2), [glyphPoint(3), twilightPoint(4), twilightPoint(5)]);
	});
	StmtTestLoop(
		t,
		f1,
		`
            NPUSHB 11 4 5 2 0 3 1 1 1 1 1 1
            SRP1
            SZP1
            SRP2
            SZP2
            SZP0
            IP
            SZP0
            IP
        `
	);
});
