import Assembler from "../../asm";
import { TTI } from "../../instr";
import { ProgramScope } from "../scope";

import { TrStmtBase } from "./base";

export class TrEntry extends TrStmtBase {
	compile(asm: Assembler, ps: ProgramScope) {
		asm.added(ps.parameters.size);
		if (ps.storageStackFrameSize) {
			asm.intro(ps.global.sp);
			asm.prim(TTI.DUP, 0, 1);
			asm.prim(TTI.RS, 1, 1);
			asm.intro(ps.storageStackFrameSize);
			asm.prim(TTI.ADD, 2, 1);
			asm.prim(TTI.WS, 2, 0);
		}
	}
}

export class TrRootEntry extends TrStmtBase {
	compile(asm: Assembler, ps: ProgramScope) {
		asm.push(
			ps.global.sp,
			ps.global.storageStackFrameStart +
				ps.global.storageStackFrameSize +
				ps.storageStackFrameSize
		);
		asm.prim(TTI.WS, 2, 0);
	}
}
