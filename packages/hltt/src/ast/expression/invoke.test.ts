import test from "ava";
import { BinaryInstrSink, TTI } from "../../instr";
import { TtProgramScopeT } from "../../scope";
import { EdslGlobalScope } from "../interface";
import { compileCompositeProgram } from "../test-util";
import { cExpr } from "./constant";
import { InvokeExpression } from "./invoke";
import { VariableFactory } from "./variable";

test("Expression: Invoke", t => {
	const gs: EdslGlobalScope = new EdslGlobalScope(VariableFactory, {
		resolve: x => (x === f1 ? fs1 : undefined)
	});
	const f1 = gs.fpgm.declare("f1"),
		fs1 = gs.createFunctionScope(f1);
	fs1.returnArity = 1;
	const x = fs1.arguments.declare();
	const y = fs1.arguments.declare();

	const ls = new TtProgramScopeT(gs, false, VariableFactory.local);
	const asm = compileCompositeProgram(gs, ls, function* (gs, ls) {
		yield new InvokeExpression(f1, [cExpr(1), cExpr(2)]);
	});

	t.deepEqual(Array.from(asm.codeGen(new BinaryInstrSink())), [TTI.PUSHB_3, 1, 2, 0, TTI.CALL]);
});
