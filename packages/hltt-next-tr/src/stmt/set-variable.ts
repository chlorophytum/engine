import { Assembler } from "@chlorophytum/hltt-next-backend";

import { ProgramScope } from "../scope";
import { TrExp, TrVar } from "../tr";

import { TrExprLikeStmtBase } from "./base";

export class TrSetVariable extends TrExprLikeStmtBase {
	constructor(private variable: TrVar, private value: TrExp) {
		super();
	}
	protected compileImpl(asm: Assembler, ps: ProgramScope) {
		this.variable.compilePtr(asm, ps);
		this.value.compile(asm, ps);
		this.variable.compileSet(asm, ps);
	}
}
