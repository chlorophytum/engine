import { Assembler, TTI } from "@chlorophytum/hltt-next-backend";

import { ProgramScope } from "../scope";
import { TrExp, TrVar } from "../tr";

import { TrExprLikeStmtBase } from "./base";

export class TrArrayInit extends TrExprLikeStmtBase {
	constructor(
		readonly arr: TrVar,
		private readonly parts: TrExp[],
		private complex?: boolean
	) {
		super();
	}
	protected compileImpl(asm: Assembler, ps: ProgramScope) {
		this.arr.compilePtr(asm, ps);
		for (let j = 0; j < this.parts.length; j++) {
			this.parts[j].compile(asm, ps);
		}
		// Stack: pArray a b c ... x
		for (let k = 0; k < this.parts.length; k++) {
			asm.needAccurateStackHeight();
			asm.intro(this.parts.length - k - 1, this.parts.length + 2 - k);
			asm.prim(TTI.CINDEX).deleted(1).added(1);
			// pArray a b c ... x pArray
			asm.prim(TTI.ADD).deleted(2).added(1);
			// pArray a[0] a[1] ... a[A - 1 - k] (pArray + (j + A - 1 - k))
			asm.prim(TTI.SWAP).deleted(2).added(2);
			this.arr.compileSet(asm, ps);
		}
		asm.prim(TTI.POP).deleted(1);
	}
}

export class TrArrayInitGetVariation extends TrExprLikeStmtBase {
	constructor(readonly arr: TrVar) {
		super();
	}
	protected compileImpl(asm: Assembler, ps: ProgramScope) {
		const arity = ps.global.getVariationArity;

		this.arr.compilePtr(asm, ps);
		asm.prim(TTI.GETVARIATION).added(arity);

		// Stack: pArray a b c ... x
		for (let k = 0; k < arity; k++) {
			asm.needAccurateStackHeight();
			asm.intro(arity - k - 1, arity + 2 - k);
			asm.prim(TTI.CINDEX).deleted(1).added(1);
			// pArray a b c ... x pArray
			asm.prim(TTI.ADD).deleted(2).added(1);
			// pArray a[0] a[1] ... a[A - 1 - k] (pArray + (j + A - 1 - k))
			asm.prim(TTI.SWAP).deleted(2).added(2);
			this.arr.compileSet(asm, ps);
		}
		asm.prim(TTI.POP).deleted(1);
	}
}
