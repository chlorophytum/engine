import test from "ava";

import { func } from "../edsl/lib-system";
import { Int } from "../edsl/type-system";

import { StmtTestLoop } from "./stmt-test-loop";

test("Libs: Recursion", t => {
	const f1 = func(Int);
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
	const f1 = func(Int);
	const f2 = func(Int);
	f1.def(function* ($, x) {
		yield f2(1);
	});
	f2.def(function* ($, x) {
		yield f1(1);
	});

	StmtTestLoop(
		t,
		f1,
		`
		PUSHB_2 1 1
		CALL
		POP
        `
	);

	StmtTestLoop(
		t,
		f2,
		`
		PUSHB_2 1 1
		CALL
		POP
        `
	);
});
