import test from "ava";

import { TextInstrSink } from "../../instr";
import { BinaryExpression } from "../expression/arith";
import { compileFdef } from "../test-util";

import { AlternativeStatement, DoWhileStatement, IfStatement, WhileStatement } from "./branch";

test("Statement: If", (t) => {
	const asm = compileFdef(function* (gs, ls) {
		yield new IfStatement(
			1,
			AlternativeStatement.from(BinaryExpression.Add(1, 2)),
			AlternativeStatement.from(BinaryExpression.Add(3, 4))
		);
	});
	t.deepEqual(
		asm.codeGen(new TextInstrSink(true)),
		TextInstrSink.rectify(`
			0 : PUSHB_1 1
			2 : IF
			3 : PUSHB_2 1 2
			6 : ADD
			7 : POP
			8 : ELSE
			9 : PUSHB_2 3 4
			12 : ADD
			13 : POP
			14 : EIF`)
	);
});

test("Statement: If EDSL", (t) => {
	const asm = compileFdef(function* (gs, ls) {
		yield new IfStatement(1)
			.then(() => [BinaryExpression.Add(1, 2)])
			.else(() => [BinaryExpression.Add(3, 4)]);
	});
	t.deepEqual(
		asm.codeGen(new TextInstrSink(true)),
		TextInstrSink.rectify(`
			0 : PUSHB_1 1
			2 : IF
			3 : PUSHB_2 1 2
			6 : ADD
			7 : POP
			8 : ELSE
			9 : PUSHB_2 3 4
			12 : ADD
			13 : POP
			14 : EIF`)
	);
});

test("Statement: While", (t) => {
	const asm = compileFdef(function* (gs, ls) {
		yield new WhileStatement(1, AlternativeStatement.from(BinaryExpression.Add(1, 2)));
	});
	t.deepEqual(
		asm.codeGen(new TextInstrSink(true)),
		TextInstrSink.rectify(`
			0 : PUSHB_2 10 1
			3 : JROF
			4 : PUSHB_2 1 2
			7 : ADD
			8 : POP
			9 : PUSHW_1 -12
			12 : JMPR
	`)
	);
});

test("Statement: Do-while", (t) => {
	const asm = compileFdef(function* (gs, ls) {
		yield new DoWhileStatement(AlternativeStatement.from(BinaryExpression.Add(1, 2)), 1);
	});
	t.deepEqual(
		asm.codeGen(new TextInstrSink(true)),
		TextInstrSink.rectify(`
			0 : PUSHB_2 1 2
			3 : ADD
			4 : POP
			5 : PUSHW_1 -10
			8 : PUSHB_1 1
			10 : JROT
	`)
	);
});
