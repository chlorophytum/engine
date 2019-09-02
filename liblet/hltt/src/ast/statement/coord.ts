import { TTI } from "../../instr";
import Assembler from "../../ir";
import { ProgramScope } from "../../scope";
import { cExpr1 } from "../expression/constant";
import { Expression, Statement, Variable } from "../interface";

import { addLongPointNumber } from "./long-point";

export class GCExpression extends Expression {
	private readonly z: Expression;
	constructor(
		_z: number | Expression,
		private readonly op: TTI,
		private readonly ls: ProgramScope<Variable>
	) {
		super();
		this.z = cExpr1(_z);
	}
	get arity() {
		return 1;
	}
	public refer(asm: Assembler) {
		this.z.refer(asm);
	}
	public compile(asm: Assembler) {
		addLongPointNumber(this.ls, asm, this.z, "zp2");
		asm.prim(this.op, 1, 1);
	}
}

export class SCFSStatement extends Statement {
	private readonly z: Expression;
	private readonly d: Expression;
	constructor(
		_z: number | Expression,
		_d: number | Expression,
		private readonly ls: ProgramScope<Variable>
	) {
		super();
		this.z = cExpr1(_z);
		this.d = cExpr1(_d);
	}
	public refer(asm: Assembler) {
		this.z.refer(asm);
		this.d.refer(asm);
	}
	public compile(asm: Assembler) {
		this.d.compile(asm);
		addLongPointNumber(this.ls, asm, this.z, "zp2");
		asm.prim(TTI.SWAP, 2, 2);
		asm.prim(TTI.SCFS, 2, 0);
	}
}
