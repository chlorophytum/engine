import Assembler from "../../asm";
import { TTI } from "../../instr";
import { EdslProgramScope, Expression, Statement } from "../interface";

import { addLongPointNumberD, addLongPointNumberUD, decideTwilight, setZone } from "./long-point";

export class DeltaStatement extends Statement {
	constructor(
		readonly op: TTI,
		private readonly allowTwilight: boolean,
		private readonly targets: Expression[],
		private readonly args: Expression[]
	) {
		super();
	}
	public compile(asm: Assembler, ps: EdslProgramScope) {
		const run = new TwilightRun(ps, this.op, asm);
		for (let j = 0; j < this.targets.length; j++) {
			if (this.targets[j] && this.args[j]) {
				run.intro(this.targets[j], this.args[j], this.allowTwilight);
			}
		}
		run.flushDecidable();
	}
}

class TwilightRun {
	constructor(
		private readonly ps: EdslProgramScope,
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

	public intro(target: Expression, arg: Expression, allowTwilight: boolean) {
		if (target.getArity(this.ps) !== 1) throw new TypeError("Argument arith != 1");
		if (arg.getArity(this.ps) !== 1) throw new TypeError("Argument arith != 1");

		const dt = allowTwilight ? decideTwilight(target) : false;
		if (dt === undefined) {
			this.flushDecidable();
			arg.compile(this.asm, this.ps);
			addLongPointNumberUD(this.ps, this.asm, target, "zp0");
			this.asm.intro(1);
			this.asm.prim(this.op, 3, 0);
		} else {
			if (dt !== this.twilight) {
				this.flushDecidable();
				this.twilight = dt;
			}

			arg.compile(this.asm, this.ps);
			addLongPointNumberD(this.ps, this.asm, target);
			//target.compile(this.asm);
			this.arity++;
		}
	}
}
