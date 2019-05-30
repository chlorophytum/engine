import { InstrSink, TTI } from "../instr";

import { PushValue, TtIR } from "./ir";
import { PushSequence } from "./push";

export class PrimIR implements TtIR {
	constructor(readonly op: TTI) {}
	codeGen<R>(sink: InstrSink<R>) {
		sink.addOp(this.op);
	}
}

export class PseudoPrimIR implements TtIR {
	private irs: TtIR[] = [];
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
