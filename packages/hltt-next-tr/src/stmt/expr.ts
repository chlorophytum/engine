import { Assembler } from "@chlorophytum/hltt-next-backend";

import { ProgramScope } from "../scope";
import { TrExp } from "../tr";

import { TrStmtBase } from "./base";

export class TrExprStmt extends TrStmtBase {
	constructor(private readonly expr: TrExp) {
		super();
	}
	compile(asm: Assembler, ps: ProgramScope) {
		const h0 = asm.softBlockBegin();
		this.expr.compile(asm, ps);
		asm.softBlockEnd(h0);
	}
}
