import { TTI } from "../../instr";
import Assembler from "../../ir";
import { ProgramScope } from "../../scope";
import { cExpr1 } from "../expression/constant";
import { Expression, Statement, Variable } from "../interface";

import { addLongPointNumberD, addLongPointNumberUD, decideTwilight, setZone } from "./long-point";

export class DeltaStatement extends Statement {
	readonly targets: Expression[];
	readonly arguments: Expression[];
	constructor(
		private readonly ls: ProgramScope<Variable>,

		readonly op: TTI,
		private readonly allowTwilight: boolean,
		_targets: Iterable<number | Expression>,
		_arguments: Iterable<number | Expression>
	) {
		super();
		this.targets = [..._targets].map(cExpr1);
		this.arguments = [..._arguments].map(cExpr1);
	}
	refer(asm: Assembler) {
		for (const x of this.targets) x.refer(asm);
		for (const x of this.arguments) x.refer(asm);
	}
	compile(asm: Assembler) {
		const run = new TwilightRun(this.ls, this.op, asm);
		for (let j = 0; j < this.targets.length; j++) {
			if (this.targets[j] && this.arguments[j]) {
				run.intro(this.targets[j], this.arguments[j], this.allowTwilight);
			}
		}
		run.flushDecidable();
	}
}

class TwilightRun {
	constructor(
		private readonly ls: ProgramScope<Variable>,
		readonly op: TTI,
		private readonly asm: Assembler
	) {}
	arity = 0;
	twilight = false;

	flushDecidable() {
		if (!this.arity) return;
		this.asm.intro(this.arity);
		setZone(this.asm, "zp0", this.twilight);
		this.asm.prim(this.op, this.arity * 2 + 1, 0);
		this.arity = 0;
	}

	intro(target: Expression, arg: Expression, allowTwilight: boolean) {
		const dt = allowTwilight ? decideTwilight(target) : false;
		if (dt === undefined) {
			this.flushDecidable();
			arg.compile(this.asm);
			addLongPointNumberUD(this.ls, this.asm, target, "zp0");
			this.asm.intro(1);
			this.asm.prim(this.op, 3, 0);
		} else {
			if (dt !== this.twilight) {
				this.flushDecidable();
				this.twilight = dt;
			}

			arg.compile(this.asm);
			addLongPointNumberD(this.ls, this.asm, target);
			//target.compile(this.asm);
			this.arity++;
		}
	}
}
