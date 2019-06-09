import { TTI } from "../../instr";
import Assembler from "../../ir";
import { cExpr1 } from "../expression/constant";
import { Expression, Statement } from "../interface";

import { setZone } from "./long-point";

export class GraphStateStatement extends Statement {
	constructor(private readonly op: TTI) {
		super();
	}
	refer() {}
	compile(asm: Assembler) {
		asm.prim(this.op, 0, 0);
	}
}
export class IupStatement extends Statement {
	constructor(private readonly op: TTI) {
		super();
	}
	refer() {}
	compile(asm: Assembler) {
		setZone(asm, "zp2", false);
		asm.prim(this.op, 0, 0);
	}
}
export class GraphStateStatement1 extends Statement {
	private readonly e: Expression;
	constructor(private readonly op: TTI, _e: number | Expression) {
		super();
		this.e = cExpr1(_e);
	}
	refer(asm: Assembler) {
		this.e.refer(asm);
	}
	compile(asm: Assembler) {
		this.e.compile(asm);
		asm.prim(this.op, 1, 0);
	}
}
