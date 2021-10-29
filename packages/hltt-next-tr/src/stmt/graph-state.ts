import { Assembler, TTI } from "@chlorophytum/hltt-next-backend";

import { setZone } from "../asm-util";
import { ProgramScope } from "../scope";
import { TrExp } from "../tr";

import { TrExprLikeStmtBase } from "./base";

export class TrGraphState0 extends TrExprLikeStmtBase {
	constructor(private readonly op: TTI) {
		super();
	}
	protected compileImpl(asm: Assembler, ps: ProgramScope) {
		asm.prim(this.op, 0, 0);
	}
}
export class TrIup extends TrExprLikeStmtBase {
	constructor(private readonly op: TTI) {
		super();
	}
	protected compileImpl(asm: Assembler, ps: ProgramScope) {
		asm.intro(1);
		setZone(asm, "zp2", false);
		asm.prim(this.op, 0, 0);
	}
}
export class TrGraphState1 extends TrExprLikeStmtBase {
	constructor(private readonly op: TTI, private readonly e: TrExp) {
		super();
	}
	protected compileImpl(asm: Assembler, ps: ProgramScope) {
		this.e.compile(asm, ps);
		asm.prim(this.op, 1, 0);
	}
}
