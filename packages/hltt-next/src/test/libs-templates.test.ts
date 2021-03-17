import test from "ava";

import { add } from "../edsl/expr-impl/arith-ctor";
import { ControlValue } from "../edsl/lib-system/cvt";
import { Func, Template } from "../edsl/lib-system/programs";
import { Bool, Frac, Int, TArith, TT } from "../edsl/type-system";

import { StmtTestLoop } from "./-stmt-test-loop";

test("Libs: Templates", t => {
	const addT = Template(<T extends TArith>(delta: number, TY: T) =>
		Func(TY)
			.returns(TY)
			.def(($, y) => [add(delta, y), $.Return(y)])
	);
	const f1 = Func().def(function* ($) {
		yield addT(1, Int)(1);
		yield addT(1, Frac)(1);
		yield addT(2, Int)(2);
	});

	StmtTestLoop(
		t,
		f1,
		`
		PUSHB_2 1 0
		CALL
		POP
		PUSHB_2 64 1
		CALL
		POP
		PUSHB_2 2 2
		CALL
		POP
        `
	);
});

test("Libs: Template literal conversion", t => {
	const idT = Template(<T extends TT>(TY: T) =>
		Func(TY)
			.returns(TY)
			.def(($, y) => [$.Return(y)])
	);
	const f1 = Func().def(function* ($) {
		yield idT(Int)(1);
		yield idT(Frac)(1.5);
		yield idT(Bool)(true);
	});

	StmtTestLoop(
		t,
		f1,
		`
		PUSHB_2 1 0
		CALL
		POP
		PUSHB_2 96 1
		CALL
		POP
		PUSHB_2 1 2
		CALL
		POP
        `
	);
});

test("Libs: Variable Arity Template", t => {
	const idT = Template((n: number) =>
		Func(Int, ...(Array(n).fill(Frac) as Frac[])).def(($, a, ...b) => [a, ...b])
	);
	const f1 = Func().def(function* ($) {
		yield idT(1)(1, 1);
		yield idT(2)(1, 1, 2);
		yield idT(3)(1, 1, 2, 3);
	});

	StmtTestLoop(
		t,
		f1,
		`
		PUSHB_3 1 64 0
		CALL
		PUSHB_4 1 64 128 1
		CALL
		PUSHB_5 1 64 128 192 2
		CALL
        `
	);
});

test("Libs: Template Cvt", t => {
	const GroupedCvt = Template((g: string) => ControlValue(Int));
	const f1 = Func().def(function* ($) {
		yield GroupedCvt("a");
		yield GroupedCvt("b");
		yield GroupedCvt("c");
	});

	StmtTestLoop(
		t,
		f1,
		`
		PUSHB_1 0
		RCVT
		POP
		PUSHB_1 1
		RCVT
		POP
		PUSHB_1 2
		RCVT
		POP
        `
	);
});
