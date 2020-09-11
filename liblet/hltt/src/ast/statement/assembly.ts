import Assembler from "../../asm";
import { Statement } from "../interface";
import { TtProgramScope } from "../scope";

export class AssemblyStatement extends Statement {
	constructor(
		protected readonly scope: TtProgramScope,
		protected readonly Asm: (a: Assembler) => void
	) {
		super();
	}
	public compile(asm: Assembler) {
		this.Asm(asm);
	}
}
