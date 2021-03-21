import { Int } from "@chlorophytum/hltt-next-type-system";
import test from "ava";

import { Func } from "../edsl/lib-system/programs";

import { StmtTestLoop } from "./-stmt-test-loop";

test("Stmt: Variable set", t => {
	const f1 = Func();
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
