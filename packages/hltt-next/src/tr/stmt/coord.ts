import Assembler from "../../asm";
import { TTI } from "../../instr";
import { setZone } from "../asm-util";
import { ProgramScope } from "../scope";
import { TrExp } from "../tr";

import { TrStmtBase } from "./base";

export class TrScfs extends TrStmtBase {
	constructor(
		private readonly z: TrExp,
		private readonly fTwilight: boolean,
		private readonly dist: TrExp
	) {
		super();
	}
	compile(asm: Assembler, ps: ProgramScope) {
		this.z.compile(asm, ps);
		this.dist.compile(asm, ps);
		setZone(asm, "zp2", this.fTwilight);
		asm.prim(TTI.SCFS, 2, 0);
	}
}
