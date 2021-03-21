import { Int } from "@chlorophytum/hltt-next-type-system";
import test from "ava";

import { Func } from "../edsl/lib-system/programs";
import { arrayInit } from "../edsl/stmt-impl/array-init";

import { StmtTestLoop } from "./-stmt-test-loop";

test("Stmt: Array init", t => {
	const f1 = Func();
	f1.def(function* ($) {
		const arr = $.LocalArray(Int, 3);
		yield arrayInit(arr, 1, 2, 3);
	});
	StmtTestLoop(
		t,
		f1,
		`
		PUSHB_1 0
		DUP
		RS
		PUSHB_1 3
		ADD
		WS
			PUSHB_1 0
			RS
			PUSHB_1 3
			SUB
			PUSHB_3 1 2 3
			PUSHB_2 2 5
			CINDEX
			ADD
			SWAP
			WS
			PUSHB_2 1 4
			CINDEX
			ADD
			SWAP
			WS
			PUSHB_2 0 3
			CINDEX
			ADD
			SWAP
			WS
			POP
		PUSHB_1 0
		DUP
		RS
		PUSHB_1 3
		SUB
		WS
        `
	);
});
