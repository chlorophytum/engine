import test from "ava";

import { func } from "../edsl/lib-system";
import { Stmt } from "../edsl/stmt";
import { TTI } from "../instr";
import { TrConst } from "../tr/exp/const";
import { TrDeltas } from "../tr/stmt/deltas";

import { StmtTestLoop } from "./-stmt-test-loop";

test("TrStmt: Deltas", t => {
	const f1 = func();
	f1.def($ => [
		new Stmt(
			new TrDeltas(TTI.DELTAP1, [
				[new TrConst(1), false, new TrConst(1)],
				[new TrConst(2), true, new TrConst(2)],
				[new TrConst(3), false, new TrConst(3)],
				[new TrConst(4), false, new TrConst(4)],
				[new TrConst(5), false, new TrConst(5)]
			])
		)
	]);

	StmtTestLoop(
		t,
		f1,
		`
            NPUSHB 16 3 3 4 4 5 5 3 1 2 2 1 0 1 1 1 1
            SZP0
            DELTAP1
            SZP0
            DELTAP1
            SZP0
            DELTAP1
        `
	);
});
