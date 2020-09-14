import test from "ava";
import { TextInstr, TTI } from "../../instr";
import { cExpr, ConstantExpression, VolatileExpression } from "../expression/constant";
import { compileProgram } from "../test-util";
import { DeltaStatement } from "./deltas";

test("Statement: Deltas", t => {
	const asm = compileProgram(function* (gs, ls) {
		yield new DeltaStatement(
			TTI.DELTAP1,
			true,
			[
				cExpr(1),
				cExpr(~2),
				cExpr(3),
				cExpr(4),
				new VolatileExpression(new ConstantExpression(5))
			],
			[1, 2, 3, 4, 5].map(cExpr)
		);
	});
	t.deepEqual(
		asm.codeGen(TextInstr.createSink()),
		TextInstr.rectify(`
			NPUSHB 15 5 5 3 3 4 4 2 1 2 2 1 0 1 1 1
			DELTAP1
			SZP0
			DELTAP1
			SZP0
			DELTAP1
			DUP
			PUSHB_1 0
			LT
			IF
			NEG
			PUSHB_1 1
			SUB
			PUSHB_1 0
			SZP0
			ELSE
			PUSHB_1 1
			SZP0
			EIF
			PUSHB_1 1
			DELTAP1`)
	);
});
