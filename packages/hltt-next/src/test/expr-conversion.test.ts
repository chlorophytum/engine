import test from "ava";

import { cast, unsafeCoerce } from "../edsl/expr-impl/expr";
import { func } from "../edsl/lib-system";
import { Frac, Int } from "../edsl/type-system";

import { StmtTestLoop } from "./stmt-test-loop";

test("Expr: Conversion", t => {
	const f1 = func(Int);
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
