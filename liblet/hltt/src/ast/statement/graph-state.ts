import Assembler from "../../asm";
import { TTI } from "../../instr";
import { EdslProgramScope, Expression, Statement } from "../interface";
import { setZone } from "./long-point";

export class GraphStateStatement extends Statement {
	constructor(private readonly op: TTI) {
		super();
	}
	public compile(asm: Assembler, ps: EdslProgramScope) {
		asm.prim(this.op, 0, 0);
	}
}
export class IupStatement extends Statement {
	constructor(private readonly op: TTI) {
		super();
	}
	public compile(asm: Assembler, ps: EdslProgramScope) {
		setZone(asm, "zp2", false);
		asm.prim(this.op, 0, 0);
	}
}
export class GraphStateStatement1 extends Statement {
	constructor(private readonly op: TTI, private readonly e: Expression) {
		super();
	}
	public compile(asm: Assembler, ps: EdslProgramScope) {
		this.e.compile(asm, ps);
		asm.prim(this.op, 1, 0);
	}
}
