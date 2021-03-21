import { If } from "@chlorophytum/hltt-next-stmt";
import { Bool, Int } from "@chlorophytum/hltt-next-type-system";
import test from "ava";

import { Func } from "../edsl/lib-system/programs";

import { StmtTestLoop } from "./-stmt-test-loop";

test("Stmt: If 1", t => {
	const f1 = Func(Bool, Int, Int);
	f1.def(function* ($, x, y, z) {
		yield If(x).Then(y).Else(z);
	});

	StmtTestLoop(
		t,
		f1,
		`
		PUSHB_1 3
		CINDEX
		IF
			PUSHB_1 2
			CINDEX
			POP
		ELSE
			DUP
			POP
		EIF
		POP
		POP
		POP
        `
	);
});

test("Stmt: If 2", t => {
	const f1 = Func(Bool, Int, Int).returns(Int);
	f1.def(function* ($, x, y, z) {
		yield If(x)
			.Then(() => [$.Return(y)])
			.Else(() => [$.Return(z)]);
	});

	StmtTestLoop(
		t,
		f1,
		`
		PUSHB_1 3
		CINDEX
		IF
			PUSHB_1 2
			CINDEX
			SWAP
			POP
			SWAP
			POP
			SWAP
			POP
			PUSHB_1 19
			JMPR
			PUSHB_2 0 0
		ELSE
			DUP
			SWAP
			POP
			SWAP
			POP
			SWAP
			POP
			PUSHB_1 5
			JMPR
			PUSHB_2 0 0
		EIF
        `
	);
});
