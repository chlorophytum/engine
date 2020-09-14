import test from "ava";

import { BinaryInstrSink, TTI } from "../../instr";
import { compileFdef } from "../test-util";

import { AlternativeStatement } from "./branch";
import { ReturnStatement } from "./return";

test("Statement: Return", t => {
	const asm = compileFdef(function* (gs, ls) {
		ls.returnArity = 2;
		const x = ls.arguments.declare();
		const y = ls.arguments.declare();
		yield AlternativeStatement.from(new ReturnStatement([x, y]));
	});
	t.deepEqual(
		[...asm.codeGen(new BinaryInstrSink())],
		[
			...[TTI.PUSHB_1, 2, TTI.CINDEX],
			...[TTI.PUSHB_1, 2, TTI.CINDEX],
			...[TTI.ROLL, TTI.POP],
			...[TTI.ROLL, TTI.POP],
			...[TTI.PUSHB_1, 8, TTI.JMPR],
			...[TTI.PUSHB_2, 0, 0],
			...[TTI.ROLL, TTI.POP],
			...[TTI.ROLL, TTI.POP]
		]
	);
});
