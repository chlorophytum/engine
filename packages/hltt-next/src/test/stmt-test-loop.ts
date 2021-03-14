import { ExecutionContext } from "ava";

import Assembler from "../asm";
import { TextInstr, TextInstrSink } from "../instr";
import { Def } from "../tr/decl";
import { GlobalScope } from "../tr/scope";

export function StmtTestLoop(t: ExecutionContext<unknown>, f1: Def, compiled: string) {
	const gs = new GlobalScope({ varDimensionCount: 0, fpgm: 0, cvt: 0, storage: 0, twilights: 0 });
	f1.populateInterface(gs);

	const [ps, tr] = f1.populateDefinition(gs);
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
