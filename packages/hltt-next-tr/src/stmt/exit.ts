import { Assembler, TTI } from "@chlorophytum/hltt-next-backend";

import { ProgramScope } from "../scope";
import { Tr } from "../tr";

import { TrStmtBase } from "./base";

export class TrLastReturn extends TrStmtBase {
	constructor(protected readonly val: null | Tr) {
		super();
	}
	willReturnAfter() {
		return true;
	}
	compile(asm: Assembler, ps: ProgramScope) {
		if (this.val) this.val.compile(asm, ps);
		asm.funcReturnKeepDelete(this.val ? 1 : 0);
		if (ps.storageStackFrameSize) {
			asm.intro(ps.global.sp);
			asm.prim(TTI.DUP).added(1);
			asm.prim(TTI.RS).deleted(1).added(1);
			asm.intro(ps.storageStackFrameSize);
			asm.prim(TTI.SUB).deleted(2).added(1);
			asm.prim(TTI.WS).deleted(2);
		}
	}
	unwrap() {
		return new TrLastReturn(this.val);
	}
}

export class TrReturn extends TrLastReturn {
	compile(asm: Assembler, ps: ProgramScope) {
		if (!ps.exitLabel) throw new TypeError("Exit label not defined");
		super.compile(asm, ps);
		const here = asm.createLabel();
		asm.push(asm.createLabelDifference(here, ps.exitLabel));
		asm.blockBegin(here);
		asm.prim(TTI.JMPR);
		asm.deleted(1);
	}
}
