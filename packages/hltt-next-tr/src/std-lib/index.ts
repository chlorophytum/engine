import { Assembler, TTI } from "@chlorophytum/hltt-next-backend";

import { ProgramScope } from "../scope";
import { TrStmt } from "../tr";

export const PtrLocal = Symbol("HLTT::Stdlib::PtrLocal");
export class TrStdLib_PtrLocal implements TrStmt {
	willReturnAfter() {
		return false;
	}
	compile(asm: Assembler, ps: ProgramScope) {
		asm.added(1);
		asm.intro(ps.global.sp);
		asm.prim(TTI.RS, 1, 1);
		asm.prim(TTI.SWAP, 2, 2);
		asm.prim(TTI.SUB, 2, 1);
	}
	static inline(asm: Assembler, ps: ProgramScope, n: number) {
		asm.intro(ps.global.sp);
		asm.prim(TTI.RS).deleted(1).added(1);
		asm.intro(n);
		asm.prim(TTI.SUB).deleted(2).added(1);
	}
}

export const AbiProlog = Symbol("HLTT::StdLib::AbiProlog");
export class TrStdLib_AbiProlog implements TrStmt {
	willReturnAfter() {
		return false;
	}
	compile(asm: Assembler, ps: ProgramScope) {
		asm.added(1);
		asm.intro(ps.global.sp);
		asm.prim(TTI.RS, 1, 1);
		asm.prim(TTI.ADD, 2, 1);
		asm.intro(ps.global.sp);
		asm.prim(TTI.SWAP, 2, 2);
		asm.prim(TTI.WS, 2, 0);
	}
	static inline(asm: Assembler, ps: ProgramScope, n: number) {
		asm.intro(ps.global.sp);
		asm.prim(TTI.DUP, 0, 1);
		asm.prim(TTI.RS, 1, 1);
		asm.intro(n);
		asm.prim(TTI.ADD, 2, 1);
		asm.prim(TTI.WS, 2, 0);
	}
}

export const AbiEpilog = Symbol("HLTT::StdLib::AbiEpilog");
export class TrStdLib_AbiEpilog implements TrStmt {
	willReturnAfter() {
		return false;
	}
	compile(asm: Assembler, ps: ProgramScope) {
		asm.added(1);
		asm.intro(ps.global.sp);
		asm.prim(TTI.RS, 1, 1);
		asm.prim(TTI.SWAP, 2, 2);
		asm.prim(TTI.SUB, 2, 1);
		asm.intro(ps.global.sp);
		asm.prim(TTI.SWAP, 2, 2);
		asm.prim(TTI.WS, 2, 0);
	}
	static inline(asm: Assembler, ps: ProgramScope, n: number) {
		asm.intro(ps.global.sp);
		asm.prim(TTI.DUP, 0, 1);
		asm.prim(TTI.RS, 1, 1);
		asm.intro(n);
		asm.prim(TTI.SUB, 2, 1);
		asm.prim(TTI.WS, 2, 0);
	}
}

export const AbiEpilogPR = Symbol("HLTT::StdLib::AbiEpilog_PopReturn");
export class TrStdLib_AbiEpilogPR implements TrStmt {
	willReturnAfter() {
		return false;
	}
	compile(asm: Assembler, ps: ProgramScope) {
		asm.added(2);
		asm.prim(TTI.SWAP, 2, 2);
		asm.prim(TTI.POP, 1, 0);
	}
	static inline(asm: Assembler, ps: ProgramScope, n: number) {
		for (let i = 0; i < n; i++) {
			asm.prim(TTI.SWAP, 2, 2);
			asm.prim(TTI.POP, 1, 0);
		}
	}
}

export const AbiEpilogPNR = Symbol("HLTT::StdLib::AbiEpilog_PopNoReturn");
export class TrStdLib_AbiEpilogPNR implements TrStmt {
	willReturnAfter() {
		return false;
	}
	compile(asm: Assembler, ps: ProgramScope) {
		asm.added(1);
		asm.prim(TTI.POP, 1, 0);
	}
	static inline(asm: Assembler, ps: ProgramScope, n: number) {
		for (let i = 0; i < n; i++) {
			asm.prim(TTI.POP, 1, 0);
		}
	}
}
