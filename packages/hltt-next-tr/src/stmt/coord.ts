import { Assembler, TTI } from "@chlorophytum/hltt-next-backend";

import { setZone } from "../asm-util";
import { ProgramScope } from "../scope";
import { TrExp } from "../tr";

import { TrExprLikeStmtBase } from "./base";

export class TrScfs extends TrExprLikeStmtBase {
	constructor(
		private readonly z: TrExp,
		private readonly fTwilight: boolean,
		private readonly dist: TrExp
	) {
		super();
	}
	protected compileImpl(asm: Assembler, ps: ProgramScope) {
		this.z.compile(asm, ps);
		this.dist.compile(asm, ps);
		setZone(asm, "zp2", this.fTwilight);
		asm.prim(TTI.SCFS, 2, 0);
	}
}
