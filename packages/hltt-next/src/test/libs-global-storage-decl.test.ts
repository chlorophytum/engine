import { Frac } from "@chlorophytum/hltt-next-type-system";
import test from "ava";

import { GlobalStorage } from "../edsl/lib-system/global-storage";
import { Func } from "../edsl/lib-system/programs";

import { StmtTestLoop } from "./-stmt-test-loop";

test("Libs: Global Storage Declaration", t => {
	const GlobalVar = GlobalStorage(Frac);
	const f1 = Func().def(function* ($) {
		yield GlobalVar;
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
