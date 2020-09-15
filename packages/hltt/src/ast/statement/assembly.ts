import Assembler from "../../asm";
import { EdslProgramScope, Statement } from "../interface";

export class AsmStatement extends Statement {
	constructor(
		protected readonly scope: EdslProgramScope,
		protected readonly Asm: (a: Assembler) => void
	) {
		super();
	}
	public compile(asm: Assembler) {
		this.Asm(asm);
	}
}
