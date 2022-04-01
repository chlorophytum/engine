import test from "ava";

import { BinaryInstrSink, TTI } from "../instr";

import Assembler from "./index";

test("TtSink 1", t => {
	const asm = new Assembler();
	asm.intro(1, 2, 3, 4);
	asm.prim(TTI.ADD);
	asm.deleted(2).added(1);
	asm.prim(TTI.ADD);
	asm.deleted(2).added(1);
	asm.intro(3);
	asm.prim(TTI.ADD);
	asm.deleted(2).added(1);
	asm.prim(TTI.ADD);
	asm.deleted(2).added(1);
	t.deepEqual(
		[...asm.codeGen(new BinaryInstrSink())],
		[TTI.PUSHB_4, 1, 2, 3, 4, TTI.ADD, TTI.ADD, TTI.PUSHB_1, 3, TTI.ADD, TTI.ADD]
	);
});
test("TtSink 2 (mimicking #PUSHON in VTT)", t => {
	const asm = new Assembler();
	asm.intro(1, 2, 3).prim(TTI.POP).deleted(1);
	asm.intro(2).prim(TTI.POP).deleted(1);
	asm.intro(3).prim(TTI.POP).deleted(1);
	asm.intro(4).prim(TTI.POP).deleted(1);
	t.deepEqual(
		[...asm.codeGen(new BinaryInstrSink())],
		[TTI.PUSHB_6, 1, 2, 4, 3, 2, 3, TTI.POP, TTI.POP, TTI.POP, TTI.POP]
	);
});
test("TtSink 3 (mimicking #PUSHON in VTT)", t => {
	const asm = new Assembler();
	asm.intro(1, 2).prim(TTI.ADD).deleted(2).added(1).prim(TTI.POP).deleted(1);
	asm.intro(3).prim(TTI.POP).deleted(1);
	asm.intro(2).prim(TTI.POP).deleted(1);
	asm.intro(3).prim(TTI.POP).deleted(1);
	asm.intro(4).prim(TTI.POP).deleted(1);
	t.deepEqual(
		[...asm.codeGen(new BinaryInstrSink())],
		[TTI.PUSHB_6, 4, 3, 2, 3, 1, 2, TTI.ADD, TTI.POP, TTI.POP, TTI.POP, TTI.POP, TTI.POP]
	);
});
test("TtSink 4 (Boundary)", t => {
	const asm = new Assembler();
	const h0 = asm.blockBegin();
	asm.intro(1, 2).prim(TTI.ADD).deleted(2).added(1).prim(TTI.POP).deleted(1);
	asm.blockEnd(h0);
	asm.intro(3).prim(TTI.POP).deleted(1);
	asm.intro(2).prim(TTI.POP).deleted(1);
	asm.intro(3).prim(TTI.POP).deleted(1);
	asm.intro(4).prim(TTI.POP).deleted(1);
	t.deepEqual(
		[...asm.codeGen(new BinaryInstrSink())],
		[
			...[TTI.PUSHB_2, 1, 2, TTI.ADD, TTI.POP],
			...[TTI.PUSHB_4, 4, 3, 2, 3, TTI.POP, TTI.POP, TTI.POP, TTI.POP]
		]
	);
});
test("TtSink 5 (Labels)", t => {
	const asm = new Assembler();
	const begin = asm.createLabel();
	const end = asm.createLabel();

	asm.intro(asm.createLabelDifference(begin, end));
	const h0 = asm.blockBegin(begin);
	asm.intro(2);
	asm.prim(TTI.POP).deleted(1);
	asm.intro(3);
	asm.prim(TTI.POP).deleted(1);
	asm.intro(4);
	asm.blockEnd(h0, end);
	asm.prim(TTI.SVTCA_x);

	t.deepEqual(
		[...asm.codeGen(new BinaryInstrSink())],
		[TTI.PUSHW_1, 0, 6, TTI.PUSHB_3, 4, 3, 2, TTI.POP, TTI.POP, TTI.POP, TTI.SVTCA_x]
	);
});
test("TtSink 6a (High rising)", t => {
	const asm = new Assembler();
	asm.prim(TTI.GETVARIATION).added(4);
	asm.prim(TTI.POP).deleted(1);
	asm.prim(TTI.POP).deleted(1);
	asm.prim(TTI.POP).deleted(1);
	asm.intro(5);
	asm.prim(TTI.ADD).deleted(2).added(1);
	asm.prim(TTI.POP).deleted(1);
	asm.intro(6).prim(TTI.SRP1).deleted(1);

	t.deepEqual(
		[...asm.codeGen(new BinaryInstrSink())],
		[
			TTI.GETVARIATION,
			TTI.POP,
			TTI.POP,
			TTI.POP,
			TTI.PUSHB_1,
			5,
			TTI.ADD,
			TTI.POP,
			TTI.PUSHB_1,
			6,
			TTI.SRP1
		]
	);
});
test("TtSink 6b (High rising)", t => {
	const asm = new Assembler();
	asm.prim(TTI.GETVARIATION).added(4);
	asm.prim(TTI.POP).deleted(1);
	asm.intro(5);
	asm.prim(TTI.ADD).deleted(2).added(1);
	asm.prim(TTI.POP).deleted(1);
	asm.intro(6).prim(TTI.SRP1).deleted(1);
	asm.intro(7).prim(TTI.SRP2).deleted(1);
	asm.prim(TTI.POP).deleted(1);
	asm.prim(TTI.POP).deleted(1);

	t.deepEqual(
		[...asm.codeGen(new BinaryInstrSink())],
		[
			TTI.GETVARIATION,
			TTI.POP,
			TTI.PUSHB_1,
			5,
			TTI.ADD,
			TTI.POP,
			TTI.PUSHB_2,
			7,
			6,
			TTI.SRP1,
			TTI.SRP2,
			TTI.POP,
			TTI.POP
		]
	);
});
