import Assembler from "../../asm";
import { ProgramScope } from "../scope";
import { TrExp } from "../tr";

import { TrStmtBase } from "./base";

export class TrExprStmt extends TrStmtBase {
	constructor(private readonly expr: TrExp) {
		super();
	}
	compile(asm: Assembler, ps: ProgramScope) {
		const h0 = asm.needAccurateStackHeight();
		this.expr.compile(asm, ps);
		asm.balanceStack(h0);
	}
}
