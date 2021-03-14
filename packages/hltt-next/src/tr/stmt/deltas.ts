import Assembler from "../../asm";
import { TTI } from "../../instr";
import { setZone } from "../asm-util";
import { ProgramScope } from "../scope";
import { TrExp, TrStmt } from "../tr";

import { TrStmtBase } from "./base";

export class TrDeltas extends TrStmtBase {
	constructor(readonly op: TTI, private readonly targets: [TrExp, boolean, TrExp][]) {
		super();
	}
	public compile(asm: Assembler, ps: ProgramScope) {
		const run = new TwilightRun(ps, this.op, asm);
		for (const [z, tw, arg] of this.targets) {
			run.intro(z, tw, arg);
		}
		run.flushDecidable();
	}
}

class TwilightRun {
	constructor(
		private readonly ps: ProgramScope,
		readonly op: TTI,
		private readonly asm: Assembler
	) {}
	public arity = 0;
	public twilight = false;

	public flushDecidable() {
		if (!this.arity) return;
		this.asm.intro(this.arity);
		setZone(this.asm, "zp0", this.twilight);
		this.asm.prim(this.op, this.arity * 2 + 1, 0);
		this.arity = 0;
	}

	public intro(target: TrExp, fTwilight: boolean, arg: TrExp) {
		if (fTwilight !== this.twilight || this.arity >= 32) {
			this.flushDecidable();
			this.twilight = fTwilight;
		}

		arg.compile(this.asm, this.ps);
		target.compile(this.asm, this.ps);
		this.arity++;
	}
}
