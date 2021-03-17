import test from "ava";

import { Func } from "../edsl/lib-system/programs";
import { Int } from "../edsl/type-system";

import { MultiStmtTestLoop, StmtTestLoop } from "./-stmt-test-loop";

test("Libs: Recursion", t => {
	const f1 = Func(Int);
	f1.def(function* ($, x) {
		yield f1(1);
	});

	StmtTestLoop(
		t,
		f1,
		`
		PUSHB_2 1 0
		CALL
		POP
        `
	);
});

test("Libs: Mutual Recursion", t => {
	const f1 = Func(Int);
	const f2 = Func(Int);
	f1.def(function* ($, x) {
		yield f2(1);
	});
	f2.def(function* ($, x) {
		yield f1(1);
	});

	MultiStmtTestLoop(
		t,
		[
			f1,
			`
			PUSHB_2 1 0
			CALL
			POP
			`
		],
		[
			f2,
			`
			PUSHB_2 1 1
			CALL
			POP
        	`
		]
	);
});
