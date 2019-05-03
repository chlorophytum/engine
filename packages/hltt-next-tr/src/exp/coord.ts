import { Assembler, TTI } from "@chlorophytum/hltt-next-backend";

import { setZone } from "../asm-util";
import { ProgramScope } from "../scope";
import { TrExp } from "../tr";

export class TrGc implements TrExp {
	constructor(
		private readonly z: TrExp,
		private readonly op: TTI, // either GC_cur or GC_orig
		private readonly fTwilight: boolean // Decided by handle type
	) {}
	isConstant() {
		return undefined;
	}
	compile(asm: Assembler, ps: ProgramScope) {
		this.z.compile(asm, ps);
		setZone(asm, "zp2", this.fTwilight);
		asm.prim(this.op, 1, 1);
	}
}
