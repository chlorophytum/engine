import test from "ava";

import { func } from "../edsl/lib-system";
import { If } from "../edsl/stmt-impl/branch";
import { Bool, Int } from "../edsl/type-system";

import { StmtTestLoop } from "./stmt-test-loop";

test("TrStmt: If 1", t => {
	const f1 = func(Bool, Int, Int);
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

test("TrStmt: If 2", t => {
	const f1 = func(Bool, Int, Int).returns(Int);
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
