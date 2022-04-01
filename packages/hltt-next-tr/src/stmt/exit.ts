import { Assembler, TTI } from "@chlorophytum/hltt-next-backend";

import { ProgramScope } from "../scope";
import * as StdLib from "../std-lib";
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
		asm.label();
		if (this.val) {
			this.val.compile(asm, ps);
			const h = asm.needAccurateStackHeight();
			if (h > 1) {
				StdLib.TrStdLib_AbiEpilogPR.inline(asm, ps, h - 1);
			}
		} else {
			const h = asm.needAccurateStackHeight();
			if (h > 0) {
				StdLib.TrStdLib_AbiEpilogPNR.inline(asm, ps, h);
			}
		}
		if (ps.storageStackFrameSize) {
			const ifnAbiEpilog = ps.global.fpgm.resolve(StdLib.AbiEpilog);
			if (ifnAbiEpilog != null) {
				asm.intro(ps.storageStackFrameSize);
				asm.intro(ifnAbiEpilog);
				asm.prim(TTI.CALL, 2, 0);
			} else {
				StdLib.TrStdLib_AbiEpilog.inline(asm, ps, ps.storageStackFrameSize);
			}
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
		const diff = asm.createLabelDifference(here, ps.exitLabel);
		asm.intro(diff);
		asm.label(here);
		asm.jumpPrim(TTI.JMPR, diff).deleted(1);
	}
}
