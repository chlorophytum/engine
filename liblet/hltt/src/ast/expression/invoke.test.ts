import test from "ava";

import { BinaryInstrSink, TTI } from "../../instr";
import { GlobalScope, ProgramScope } from "../../scope";
import { compileCompositeProgram } from "../test-util";

import { InvokeExpression } from "./invoke";
import { VariableFactory } from "./variable";

test("Expression: Invoke", t => {
	const gs = new GlobalScope(VariableFactory);
	const f1 = gs.fpgm.declare("f1"),
		fs1 = gs.createFunctionScope(f1);
	fs1.returnArity = 1;
	const x = fs1.arguments.declare();
	const y = fs1.arguments.declare();
	const ls = new ProgramScope(gs, false, VariableFactory.local);

	const asm = compileCompositeProgram(gs, ls, function*(gs, ls) {
		yield new InvokeExpression(ls, f1, [1, 2]);
	});

	t.deepEqual(Array.from(asm.codeGen(new BinaryInstrSink())), [TTI.PUSHB_3, 1, 2, 0, TTI.CALL]);
});
