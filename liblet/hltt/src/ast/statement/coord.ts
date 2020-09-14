import Assembler from "../../asm";
import { TTI } from "../../instr";
import { EdslProgramScope, Expression, Statement } from "../interface";
import { addLongPointNumber } from "./long-point";

export class GCExpression extends Expression {
	constructor(private readonly z: Expression, private readonly op: TTI) {
		super();
	}
	getArity() {
		return 1;
	}
	public compile(asm: Assembler, ps: EdslProgramScope) {
		addLongPointNumber(ps, asm, this.z, "zp2");
		asm.prim(this.op, 1, 1);
	}
}

export class SCFSStatement extends Statement {
	constructor(private readonly z: Expression, private readonly d: Expression) {
		super();
	}
	public compile(asm: Assembler, ps: EdslProgramScope) {
		this.d.compile(asm, ps);
		addLongPointNumber(ps, asm, this.z, "zp2");
		asm.prim(TTI.SWAP, 2, 2);
		asm.prim(TTI.SCFS, 2, 0);
	}
}
