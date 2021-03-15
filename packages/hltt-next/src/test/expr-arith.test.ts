import test from "ava";

import { add, mul } from "../edsl/expr-impl/arith-ctor";
import { Func } from "../edsl/lib-system/programs";
import { Frac, Int } from "../edsl/type-system";

import { StmtTestLoop } from "./-stmt-test-loop";

test("Expr: Arith 1", t => {
	const f1 = Func(Int, Int);
	f1.def(function* ($, y, z) {
		yield add(y, z);
		yield add(1, z);
	});

	StmtTestLoop(
		t,
		f1,
		`
		PUSHB_1 2
		CINDEX
		PUSHB_1 2
		CINDEX
		ADD
		POP
		PUSHB_1 1
		PUSHB_1 2
		CINDEX
		ADD
		POP
		POP
		POP
        `
	);
});

test("Expr: Arith 2", t => {
	const f1 = Func(Frac, Frac);
	f1.def(function* ($, y, z) {
		yield add(y, z);
		yield add(1, z);
	});

	StmtTestLoop(
		t,
		f1,
		`
		PUSHB_1 2
		CINDEX
		PUSHB_1 2
		CINDEX
		ADD
		POP
		PUSHB_1 64
		PUSHB_1 2
		CINDEX
		ADD
		POP
		POP
		POP
        `
	);
});

test("Expr: Arith 3", t => {
	const f1 = Func(Frac, Frac);
	f1.def(function* ($, y, z) {
		yield mul(y, z);
		yield mul(1, z);
	});

	StmtTestLoop(
		t,
		f1,
		`
		PUSHB_1 2
		CINDEX
		PUSHB_1 2
		CINDEX
		MUL
		POP
		PUSHB_1 64
		PUSHB_1 2
		CINDEX
		MUL
		POP
		POP
		POP
        `
	);
});

test("Expr: Arith 4", t => {
	const f1 = Func(Int, Int);
	f1.def(function* ($, y, z) {
		yield mul(y, z);
		yield mul(1, z);
	});

	StmtTestLoop(
		t,
		f1,
		`
		PUSHB_1 2
		CINDEX
		PUSHB_1 2
		CINDEX
		PUSHW_1 4096
		MUL
		MUL
		POP
		PUSHB_1 64
		PUSHB_1 2
		CINDEX
		MUL
		POP
		POP
		POP
        `
	);
});
