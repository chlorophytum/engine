import test from "ava";

import { add } from "../edsl/expr-impl/arith-ctor";
import { func, template } from "../edsl/lib-system";
import { Bool, Frac, Int, TArith, TT } from "../edsl/type-system";

import { StmtTestLoop } from "./-stmt-test-loop";

test("Libs: Templates", t => {
	const addT = template(<T extends TArith>(delta: number, TY: T) =>
		func(TY)
			.returns(TY)
			.def(($, y) => [add(delta, y)])
	);
	const f1 = func().def(function* ($) {
		yield addT(1, Int)(1);
		yield addT(1, Frac)(1);
		yield addT(2, Int)(2);
	});

	StmtTestLoop(
		t,
		f1,
		`
		PUSHB_2 1 1
		CALL
		POP
		PUSHB_2 64 2
		CALL
		POP
		PUSHB_2 2 3
		CALL
		POP
        `
	);
});

test("Libs: Template literal conversion", t => {
	const idT = template(<T extends TT>(TY: T) =>
		func(TY)
			.returns(TY)
			.def(($, y) => [y])
	);
	const f1 = func().def(function* ($) {
		yield idT(Int)(1);
		yield idT(Frac)(1.5);
		yield idT(Bool)(true);
	});

	StmtTestLoop(
		t,
		f1,
		`
		PUSHB_2 1 1
		CALL
		POP
		PUSHB_2 96 2
		CALL
		POP
		PUSHB_2 1 3
		CALL
		POP
        `
	);
});

test("Libs: Variable Arity Template", t => {
	const idT = template((n: number) =>
		func(Int, ...(Array(n).fill(Frac) as Frac[])).def(($, a, ...b) => [a, ...b])
	);
	const f1 = func().def(function* ($) {
		yield idT(1)(1, 1);
		yield idT(2)(1, 1, 2);
		yield idT(3)(1, 1, 2, 3);
	});

	StmtTestLoop(
		t,
		f1,
		`
		PUSHB_3 1 64 1
		CALL
		PUSHB_4 1 64 128 2
		CALL
		PUSHB_5 1 64 128 192 3
		CALL
        `
	);
});
