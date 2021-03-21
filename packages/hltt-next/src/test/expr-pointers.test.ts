import { Int, Store } from "@chlorophytum/hltt-next-type-system";
import test from "ava";

import { integer, volatile } from "../edsl/expr-impl/const";
import { Func } from "../edsl/lib-system/programs";

import { StmtTestLoop } from "./-stmt-test-loop";

test("Expr: Pointer from Parameter", t => {
	const f1 = Func(Store(Int)).def(function* ($, x) {
		yield x.deRef;
		yield x.part(1);
	});

	StmtTestLoop(
		t,
		f1,
		`
		DUP
		RS
		POP
		DUP
		PUSHB_1 1
		ADD
		RS
		POP
		POP
        `
	);
});

test("Expr: Pointer of Variable", t => {
	const f1 = Func().def(function* ($) {
		const x = $.Local(Int);
		yield x.ptr;
		yield x.offsetPtr(1);
		yield x.ptr.part(1);
		yield x.ptr.part(volatile(integer(1)));
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
			PUSHB_1 0
			RS
			PUSHB_1 1
			SUB
			POP
			PUSHB_1 0
			RS
			PUSHB_1 0
			SUB
			POP
			PUSHB_1 0
			RS
			PUSHB_1 0
			SUB
			RS
			POP
			PUSHB_1 0
			RS
			PUSHB_1 1
			SUB
			PUSHB_1 1
			ADD
			RS
			POP
		PUSHB_1 0
		DUP
		RS
		PUSHB_1 1
		SUB
		WS
        `
	);
});
