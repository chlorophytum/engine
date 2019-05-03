import { cast, unsafeCoerce } from "@chlorophytum/hltt-next-expr";
import { Frac, Int } from "@chlorophytum/hltt-next-type-system";
import test from "ava";

import { Func } from "../edsl/lib-system/programs";

import { StmtTestLoop } from "./-stmt-test-loop";

test("Expr: Conversion", t => {
	const f1 = Func(Int);
	f1.def(function* ($, x) {
		yield cast(Frac, x);
		yield unsafeCoerce(Frac, x);
	});

	StmtTestLoop(
		t,
		f1,
		`
		DUP
		PUSHW_1 4096
		MUL
		POP
		DUP
		POP
		POP
        `
	);
});
