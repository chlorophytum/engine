import { Assembler, TextInstr, TextInstrSink } from "@chlorophytum/hltt-next-backend";
import { Def, GlobalScope, ProgramRecord } from "@chlorophytum/hltt-next-tr";
import { ExecutionContext } from "ava";

export function StmtTestLoop(
	t: ExecutionContext<unknown>,
	f1: Def<ProgramRecord>,
	compiled: string
) {
	return MultiStmtTestLoop(t, [f1, compiled]);
}

export function MultiStmtTestLoop(
	t: ExecutionContext<unknown>,
	...pairs: [Def<ProgramRecord>, string][]
) {
	const gs = new GlobalScope({
		varDimensionCount: 0,
		fpgm: 0,
		cvt: 0,
		storage: 0,
		twilights: 0
	});
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
