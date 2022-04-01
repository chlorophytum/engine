import { InstrSink, TTI } from "../instr";

import { PushValue, TtAsmInstr } from "./asm-instr";
import { TtLabel, TtLabelDifference } from "./label";
import { PushSequence } from "./push";
import { TtRelocatable } from "./relocatable";

export class PrimIR implements TtAsmInstr {
	constructor(readonly op: TTI) {}
	codeGen<R>(sink: InstrSink<R>) {
		sink.addOp(this.op);
	}
}

export class JumpIR implements TtAsmInstr {
	constructor(readonly op: TTI, readonly offset: TtLabelDifference) {}
	codeGen<R>(sink: InstrSink<R>) {
		if (sink.addJumpOp) {
			sink.addJumpOp(
				this.op,
				this.offset.asRelocatable().resolveSymbol(),
				this.offset.to.resolveSymbol()
			);
		} else {
			sink.addOp(this.op);
		}
	}
}

export class PseudoPrimIR implements TtAsmInstr {
	private irs: TtAsmInstr[] = [];
	prim(op: TTI) {
		this.irs.push(new PrimIR(op));
		return this;
	}
	push(...xs: PushValue[]) {
		const s = new PushSequence();
		s.add(...xs);
		this.irs.push(s);
		return this;
	}
	codeGen<R>(sink: InstrSink<R>, round: number) {
		for (const ir of this.irs) ir.codeGen(sink, round);
	}
}
