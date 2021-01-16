import Assembler from "../../asm";
import { EdslProgramScope, Statement } from "../interface";

import { BeginStatement } from "./begin";
import { LastReturnStatement } from "./return";

export class SequenceStatement extends Statement {
	private readonly parts: Statement[];
	constructor(_parts: Iterable<Statement>) {
		super();
		this.parts = [..._parts];
	}
	public compile(asm: Assembler, ps: EdslProgramScope) {
		for (const st of this.parts) st.compile(asm, ps);
	}
	public willReturnAfter() {
		const last = this.parts[this.parts.length - 1];
		return last && last.willReturnAfter();
	}
	public addLastReturn(scope: EdslProgramScope) {
		const last = this.parts[this.parts.length - 1];
		if (last && last instanceof LastReturnStatement) {
			this.parts[this.parts.length - 1] = new LastReturnStatement(last.parts);
		} else if (!this.willReturnAfter()) {
			this.parts.push(new LastReturnStatement(new Array(scope.returnArity || 0).fill(0)));
		}
		this.parts.unshift(new BeginStatement());
	}
}
