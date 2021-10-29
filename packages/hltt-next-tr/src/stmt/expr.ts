import { Assembler } from "@chlorophytum/hltt-next-backend";

import { ProgramScope } from "../scope";
import { TrExp } from "../tr";

import { TrExprLikeStmtBase } from "./base";

export class TrExprStmt extends TrExprLikeStmtBase {
	constructor(private readonly expr: TrExp) {
		super();
	}
	protected compileImpl(asm: Assembler, ps: ProgramScope) {
		this.expr.compile(asm, ps);
	}
}
