import { Assembler } from "@chlorophytum/hltt-next-backend";

import { ProgramScope } from "../scope";
import { TrStmt } from "../tr";

export abstract class TrStmtBase implements TrStmt {
	willReturnAfter() {
		return false;
	}
	abstract compile(asm: Assembler, ps: ProgramScope): void;
}
