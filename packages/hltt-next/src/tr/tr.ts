import Assembler from "../asm";

import { ProgramScope } from "./scope";

// Tr : Tree representation
export interface Tr {
	compile(asm: Assembler, ps: ProgramScope): void;
}
export interface TrExp extends Tr {
	isConstant(): undefined | number;
}
export interface TrVar extends TrExp {
	compileSet(asm: Assembler, ps: ProgramScope): void;
	compilePtr(asm: Assembler, ps: ProgramScope): void;
}

export interface TrStmt extends Tr {
	willReturnAfter(): boolean;
}
