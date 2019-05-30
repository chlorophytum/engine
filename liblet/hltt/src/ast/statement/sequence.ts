import Assembler from "../../ir";
import { ProgramScope } from "../../scope";
import { Statement, Variable } from "../interface";

import { BeginStatement } from "./begin";
import { LastReturnStatement } from "./return";

export class SequenceStatement extends Statement {
	private readonly parts: Statement[];
	constructor(_parts: Iterable<Statement>) {
		super();
		this.parts = [..._parts];
	}
	refer(asm: Assembler) {
		for (const part of this.parts) part.refer(asm);
	}
	compile(asm: Assembler) {
		for (const st of this.parts) st.compile(asm);
	}
	willReturnAfter() {
		const last = this.parts[this.parts.length - 1];
		return last && last.willReturnAfter();
	}
	addLastReturn(scope: ProgramScope<Variable>) {
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
