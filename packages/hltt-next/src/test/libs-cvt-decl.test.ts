import { glyphPoint } from "@chlorophytum/hltt-next-expr";
import { Miap } from "@chlorophytum/hltt-next-stmt";
import { Frac } from "@chlorophytum/hltt-next-type-system";
import test from "ava";

import { ControlValue } from "../edsl/lib-system/cvt";
import { Func } from "../edsl/lib-system/programs";

import { StmtTestLoop } from "./-stmt-test-loop";

test("Libs: CVT Declaration", t => {
	const Cap = ControlValue(Frac);
	const f1 = Func().def(function* ($) {
		yield Cap;
		yield Miap(glyphPoint(1), Cap.ptr);
	});

	StmtTestLoop(
		t,
		f1,
		`
		PUSHB_1 0
		RCVT
		POP
		PUSHB_3 1 0 1
		SZP0
		MIAP_noRnd
        `
	);
});
