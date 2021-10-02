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
				const ifnPop = ps.global.fpgm.resolve(StdLib.AbiEpilogPR);
				if (ifnPop) {
					asm.intro(h - 1);
					asm.intro(ifnPop);
					asm.prim(TTI.LOOPCALL, h + 2, 1);
				} else {
					StdLib.TrStdLib_AbiEpilogPR.inline(asm, ps, h - 1);
				}
			}
		} else {
			const h = asm.needAccurateStackHeight();
			if (h > 0) {
				const ifnPop = ps.global.fpgm.resolve(StdLib.AbiEpilogPNR);
				if (ifnPop) {
					asm.intro(h);
					asm.intro(ifnPop);
					asm.prim(TTI.LOOPCALL, h + 2, 0);
				} else {
					StdLib.TrStdLib_AbiEpilogPNR.inline(asm, ps, h);
				}
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
		asm.intro(asm.createLabelDifference(here, ps.exitLabel));
		asm.blockBegin(here);
		asm.prim(TTI.JMPR).deleted(1);
	}
}
