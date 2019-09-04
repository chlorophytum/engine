import Assembler from "../../ir";
import { ProgramScope } from "../../scope";
import { Statement, Variable } from "../interface";

export class AssemblyStatement extends Statement {
	constructor(
		protected readonly scope: ProgramScope<Variable>,
		protected readonly Asm: (a: Assembler) => void
	) {
		super();
	}
	public refer(asm: Assembler) {}
	public compile(asm: Assembler) {
		this.Asm(asm);
	}
}
