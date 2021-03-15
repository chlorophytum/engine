import test from "ava";

import { glyphPoint, twilightPoint } from "../edsl/expr-impl/const";
import { Func } from "../edsl/lib-system/programs";
import { Delta } from "../edsl/stmt-impl/delta";

import { StmtTestLoop } from "./-stmt-test-loop";

test("Stmt: Deltas", t => {
	const f1 = Func();
	f1.def(function* ($) {
		yield Delta.p1(
			[glyphPoint(1), 1],
			[twilightPoint(2), 2],
			[glyphPoint(3), 3],
			[glyphPoint(4), 4],
			[glyphPoint(5), 5]
		);
	});
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
