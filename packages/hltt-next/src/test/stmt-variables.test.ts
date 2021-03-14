import test from "ava";

import { func } from "../edsl/lib-system";
import { Int } from "../edsl/type-system";

import { StmtTestLoop } from "./-stmt-test-loop";

test("Stmt: Variable set", t => {
	const f1 = func();
	f1.def(function* ($) {
		const x = $.Local(Int);
		yield x.set(3);
		yield x.ptr.deRef.set(3);
	});
	StmtTestLoop(
		t,
		f1,
		`
		PUSHB_1 0
		DUP
		RS
		PUSHB_1 1
		ADD
		WS
			PUSHB_2 0 0
			RS
			PUSHB_1 1
			SUB
			PUSHB_1 3
			WS
			RS
			PUSHB_1 1
			SUB
			PUSHB_1 3
			WS
		PUSHB_1 0
		DUP
		RS
		PUSHB_1 1
		SUB
		WS
        `
	);
});
