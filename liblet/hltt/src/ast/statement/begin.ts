import Assembler from "../../asm";
import { TTI } from "../../instr";
import { EdslProgramScope, Statement } from "../interface";

export class BeginStatement extends Statement {
	constructor() {
		super();
	}
	public compile(asm: Assembler, ps: EdslProgramScope) {
		asm.added(ps.arguments.size);
		if (ps.locals.size) {
			asm.intro(ps.globals.sp);
			asm.prim(TTI.DUP).added(1).prim(TTI.RS).deleted(1).added(1);
			asm.intro(ps.locals.size).prim(TTI.ADD).deleted(2).added(1);
			asm.prim(TTI.WS).deleted(2);
		}
	}
}
export class ProgramBeginStatement extends Statement {
	constructor() {
		super();
	}
	public compile(asm: Assembler, ps: EdslProgramScope) {
		asm.push(ps.globals.sp, ps.locals.base + ps.locals.size).prim(TTI.WS, 2, 0);
	}
}
