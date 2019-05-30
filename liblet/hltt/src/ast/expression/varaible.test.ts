import test from "ava";

import { TextInstrSink } from "../../instr";
import { compileFdef, compileProgram } from "../test-util";

import { BinaryExpression } from "./arith";
import { VolatileExpression } from "./constant";
import { ArrayIndex, ArrayInit, TupleExpression } from "./pointer";
import { VariableSet } from "./variable";

test("Expression: Local variable (entry)", t => {
	const asm = compileProgram(function*(gs, ls) {
		const a = ls.locals.declare(2);
		const b = ls.locals.declare();
		yield new VariableSet(b, a);
	});

	t.deepEqual(
		asm.codeGen(new TextInstrSink()),
		TextInstrSink.rectify(`
			PUSHB_2 3 1
			RS
			WS
	`)
	);
});

test("Expression: Local variable arguments (fn)", t => {
	const asm = compileFdef(function*(gs, ls) {
		const x = ls.arguments.declare();
		const a = ls.locals.declare();
		yield new VariableSet(a, BinaryExpression.Add(BinaryExpression.Sub(1, 2), x));
	});

	t.deepEqual(
		asm.codeGen(new TextInstrSink()),
		TextInstrSink.rectify(`
			PUSHB_2 0 0
			DUP
			RS
			PUSHB_1 1
			ADD
			WS
			RS
			PUSHB_2 1 2
			SUB
			PUSHB_1 3
			CINDEX
			ADD
			WS
			POP
			PUSHB_1 0
			DUP
			RS
			PUSHB_1 1
			SUB
			WS`)
	);
});

test("Expression: Local array", t => {
	const asm = compileProgram(function*(gs, ls) {
		const a = ls.locals.declare(10);
		const b = ls.locals.declare();
		yield new VariableSet(b, new ArrayIndex(a, 5));
	});

	t.deepEqual(
		asm.codeGen(new TextInstrSink()),
		TextInstrSink.rectify(`
			PUSHB_2 11 6
			RS
			WS
	`)
	);
});

test("Expression: CVT array", t => {
	const asm = compileProgram(function*(gs, ls) {
		const a = gs.cvt.declare("a", 10);
		const b = ls.locals.declare();
		yield new VariableSet(b, new ArrayIndex(a, 5));
		yield new VariableSet(
			b,
			new ArrayIndex(a, new VolatileExpression(BinaryExpression.Add(3, 3)))
		);
	});

	t.deepEqual(
		asm.codeGen(new TextInstrSink()),
		TextInstrSink.rectify(`
			PUSHB_6 1 0 3 3 1 5
			RCVT
			WS
			ADD
			ADD
			RCVT
			WS
	`)
	);
});

test("Expression: CVT array init", t => {
	const asm = compileProgram(function*(gs, ls) {
		const a = gs.cvt.declare("a", 5);
		yield new ArrayInit(a.index, [1, 2, 3, 4, 5], true);
	});

	t.deepEqual(
		asm.codeGen(new TextInstrSink()),
		TextInstrSink.rectify(`
			PUSHB_6 0 1 2 3 4 5
			PUSHB_2 4 7
			CINDEX
			ADD
			SWAP
			WCVTP
			PUSHB_2 3 6
			CINDEX
			ADD
			SWAP
			WCVTP
			PUSHB_2 2 5
			CINDEX
			ADD
			SWAP
			WCVTP
			PUSHB_2 1 4
			CINDEX
			ADD
			SWAP
			WCVTP
			PUSHB_2 0 3
			CINDEX
			ADD
			SWAP
			WCVTP
			POP
	`)
	);
});

test("Expression: CVT array init 2", t => {
	const asm = compileProgram(function*(gs, ls) {
		const a = gs.cvt.declare("a", 5);
		yield new ArrayInit(a.index, [1, 2, 3, 4, 5]);
	});

	t.deepEqual(
		asm.codeGen(new TextInstrSink()),
		TextInstrSink.rectify(`
			NPUSHB 10 4 5 3 4 2 3 1 2 0 1
			WCVTP
			WCVTP
			WCVTP
			WCVTP
			WCVTP`)
	);
});

test("Expression: CVT array init 3", t => {
	const asm = compileProgram(function*(gs, ls) {
		const a = gs.cvt.declare("a", 5);
		yield new ArrayInit(a.index, [new TupleExpression([1, 2, 3, 4, 5])], true);
	});

	t.deepEqual(
		asm.codeGen(new TextInstrSink()),
		TextInstrSink.rectify(`
			PUSHB_6 0 1 2 3 4 5
			PUSHB_2 4 7
			CINDEX
			ADD
			SWAP
			WCVTP
			PUSHB_2 3 6
			CINDEX
			ADD
			SWAP
			WCVTP
			PUSHB_2 2 5
			CINDEX
			ADD
			SWAP
			WCVTP
			PUSHB_2 1 4
			CINDEX
			ADD
			SWAP
			WCVTP
			PUSHB_2 0 3
			CINDEX
			ADD
			SWAP
			WCVTP
			POP
	`)
	);
});
