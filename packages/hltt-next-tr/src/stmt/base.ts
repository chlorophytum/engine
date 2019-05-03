import { Assembler } from "@chlorophytum/hltt-next-backend";

import { ProgramScope } from "../scope";
import { TrStmt } from "../tr";

export abstract class TrStmtBase implements TrStmt {
	willReturnAfter() {
		return false;
	}
	abstract compile(asm: Assembler, ps: ProgramScope): void;
}

export abstract class TrExprLikeStmtBase extends TrStmtBase {
	protected abstract compileImpl(asm: Assembler, ps: ProgramScope): void;
	compile(asm: Assembler, ps: ProgramScope) {
		this.compileImpl(asm, ps);
	}
}
