import { Assembler, TextInstr, TextInstrSink } from "@chlorophytum/hltt-next-backend";
import { Def, GlobalScope, ProgramRecord } from "@chlorophytum/hltt-next-tr";
import { ExecutionContext } from "ava";

export const StmtTestLoop = Object.assign(
	(t: ExecutionContext<unknown>, f1: Def<ProgramRecord>, compiled: string) => {
		return MultiStmtTestLoopImpl(t, false, [[f1, compiled]]);
	},
	{
		relocatable(t: ExecutionContext<unknown>, f1: Def<ProgramRecord>, compiled: string) {
			return MultiStmtTestLoopImpl(t, true, [[f1, compiled]]);
		}
	}
);

export const MultiStmtTestLoop = Object.assign(
	(t: ExecutionContext<unknown>, ...pairs: [Def<ProgramRecord>, string][]) => {
		return MultiStmtTestLoopImpl(t, false, pairs);
	},
	{
		relocatable(t: ExecutionContext<unknown>, ...pairs: [Def<ProgramRecord>, string][]) {
			return MultiStmtTestLoopImpl(t, true, pairs);
		}
	}
);

function MultiStmtTestLoopImpl(
	t: ExecutionContext<unknown>,
	generateRelocatableCode: boolean,
	pairs: [Def<ProgramRecord>, string][]
) {
	const gs = new GlobalScope(
		{
			generateRelocatableCode,
			stackPointerStorageID: 0
		},
		{
			varDimensionCount: 0,
			fpgmBase: 0,
			cvtBase: 0,
			storageBase: 1,
			twilightsBase: 0
		}
	);
	for (const [f1, compiled] of pairs) {
		const [ps, tr] = f1.computeDefinition(gs);
		const asm = new Assembler();
		if (ps.isProcedure) {
			const h0 = asm.blockBegin();
			tr.compile(asm, ps);
			asm.blockEnd(h0);
		}
		if (!ps.isProcedure) {
			ps.exitLabel = asm.createLabel();
			tr.compile(asm, ps);
			asm.label(ps.exitLabel);
		}

		t.deepEqual(asm.codeGen(new TextInstrSink()), TextInstr.rectify(compiled));
	}
}
