import Assembler from "../../asm";
import { ProgramScope } from "../scope";
import { TrStmt } from "../tr";

export abstract class TrStmtBase implements TrStmt {
	willReturnAfter() {
		return false;
	}
	abstract compile(asm: Assembler, ps: ProgramScope): void;
}
