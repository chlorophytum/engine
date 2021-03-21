import { add } from "@chlorophytum/hltt-next-expr";
import { Bool, Frac, Int, TArith, TT } from "@chlorophytum/hltt-next-type-system";
import test from "ava";

import { ControlValue } from "../edsl/lib-system/cvt";
import { CallableFunc } from "../edsl/lib-system/interfaces";
import { Func } from "../edsl/lib-system/programs";
import { Template } from "../edsl/lib-system/template";

import { MultiStmtTestLoop, StmtTestLoop } from "./-stmt-test-loop";

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

test("Libs: Template Mutual Recursion", t => {
	const idA: <T extends TT>(ty: T) => CallableFunc<[T], T> = Template(<T extends TT>(ty: T) =>
		Func(ty)
			.returns(ty)
			.def(function* ($, x) {
				yield $.Return(idB(ty)(x));
			})
	);
	const idB: <T extends TT>(ty: T) => CallableFunc<[T], T> = Template(<T extends TT>(ty: T) =>
		Func(ty)
			.returns(ty)
			.def(function* ($, x) {
				yield $.Return(idA(ty)(x));
			})
	);

	MultiStmtTestLoop(
		t,
		[
			idA(Int),
			`
		DUP
		PUSHB_1 0
		CALL
		SWAP
		POP
		PUSHB_1 1
		JMPR
        `
		],
		[
			idB(Int),
			`
		DUP
		PUSHB_1 1
		CALL
		SWAP
		POP
		PUSHB_1 1
		JMPR
        `
		],
		[
			idA(Frac),
			`
		DUP
		PUSHB_1 2
		CALL
		SWAP
		POP
		PUSHB_1 1
		JMPR
        `
		],
		[
			idB(Frac),
			`
		DUP
		PUSHB_1 3
		CALL
		SWAP
		POP
		PUSHB_1 1
		JMPR
        `
		]
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
