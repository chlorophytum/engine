import test from "ava";

import { TTI } from "../instr";

import { PushSequence } from "./push";

test("PUSH tests (pushb)", t => {
	const p = new PushSequence();
	p.add(1, 2, 3, 4);
	t.deepEqual([...p.toBuffer()], [TTI.PUSHB_4, 1, 2, 3, 4]);
});
test("PUSH tests (npushb)", t => {
	const p = new PushSequence();
	p.add(1, 2, 3, 4, 5, 6, 7, 8, 9);
	t.deepEqual([...p.toBuffer()], [TTI.NPUSHB, 9, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
});
test("PUSH tests (mixed)", t => {
	const p = new PushSequence();
	p.add(-1, 2, 3, 4, 5, 6, 7, 8, 9);
	t.deepEqual([...p.toBuffer()], [TTI.PUSHW_1, 0xff, 0xff, TTI.PUSHB_8, 2, 3, 4, 5, 6, 7, 8, 9]);
});
test("PUSH tests (mixed2)", t => {
	const p = new PushSequence();
	p.add(-1, 2, -3, 4, 5, 6, 7, 8, 9);
	t.deepEqual(
		[...p.toBuffer()],
		[TTI.PUSHW_3, 0xff, 0xff, 0, 2, 0xff, 0xfd, TTI.PUSHB_6, 4, 5, 6, 7, 8, 9]
	);
});
