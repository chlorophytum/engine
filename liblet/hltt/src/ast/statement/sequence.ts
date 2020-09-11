import Assembler from "../../asm";
import { Statement } from "../interface";
import { TtProgramScope } from "../scope";
import { BeginStatement } from "./begin";
import { LastReturnStatement } from "./return";

export class SequenceStatement extends Statement {
	private readonly parts: Statement[];
	constructor(_parts: Iterable<Statement>) {
		super();
		this.parts = [..._parts];
	}
	public compile(asm: Assembler) {
		for (const st of this.parts) st.compile(asm);
	}
	public willReturnAfter() {
		const last = this.parts[this.parts.length - 1];
		return last && last.willReturnAfter();
	}
	public addLastReturn(scope: TtProgramScope) {
		const last = this.parts[this.parts.length - 1];
		if (last && last instanceof LastReturnStatement) {
			this.parts[this.parts.length - 1] = new LastReturnStatement(scope, last.parts);
		} else if (!this.willReturnAfter()) {
			this.parts.push(
				new LastReturnStatement(scope, new Array(scope.returnArity || 0).fill(0))
			);
		}
		this.parts.unshift(new BeginStatement(scope));
	}
}
