import Assembler from "../../asm";
import { TTI } from "../../instr";
import { Statement } from "../interface";
import { TtProgramScope } from "../scope";

export class BeginStatement extends Statement {
	constructor(protected readonly scope: TtProgramScope) {
		super();
	}
	public compile(asm: Assembler) {
		asm.added(this.scope.arguments.size);
		if (this.scope.locals.size) {
			asm.intro(this.scope.globals.sp);
			asm.prim(TTI.DUP).added(1).prim(TTI.RS).deleted(1).added(1);
			asm.intro(this.scope.locals.size).prim(TTI.ADD).deleted(2).added(1);
			asm.prim(TTI.WS).deleted(2);
		}
	}
}
export class ProgramBeginStatement extends Statement {
	constructor(protected readonly scope: TtProgramScope) {
		super();
	}
	public compile(asm: Assembler) {
		asm.push(this.scope.globals.sp, this.scope.locals.base + this.scope.locals.size).prim(
			TTI.WS,
			2,
			0
		);
	}
}
