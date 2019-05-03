import { Assembler, offsetRelocatablePushValue, TTI } from "@chlorophytum/hltt-next-backend";

import { ProgramScope } from "../scope";
import * as StdLib from "../std-lib";

import { TrExprLikeStmtBase, TrStmtBase } from "./base";

export class TrEntry extends TrStmtBase {
	compile(asm: Assembler, ps: ProgramScope) {
		asm.added(ps.parameters.size);
		if (!ps.storageStackFrameSize) return;
		const ifnAbiProlog = ps.global.fpgm.resolve(StdLib.AbiProlog);
		if (ifnAbiProlog != null) {
			asm.intro(ps.storageStackFrameSize);
			asm.intro(ifnAbiProlog);
			asm.prim(TTI.CALL, 2, 0);
		} else {
			StdLib.TrStdLib_AbiProlog.inline(asm, ps, ps.storageStackFrameSize);
		}
	}
}

export class TrRootEntry extends TrExprLikeStmtBase {
	protected compileImpl(asm: Assembler, ps: ProgramScope) {
		asm.intro(
			ps.global.sp,
			offsetRelocatablePushValue(
				ps.global.getVolatileZoneStartValue(),
				ps.storageStackFrameSize
			)
		);
		asm.prim(TTI.WS, 2, 0);
	}
}
