import Assembler from "../../asm";
import { ProgramScope } from "../scope";
import { TrStmt } from "../tr";

import { TrStmtBase } from "./base";
import { TrEntry } from "./entry";
import { TrLastReturn } from "./exit";

export class TrSeq extends TrStmtBase {
	private readonly parts: TrStmt[];
	constructor(private readonly block: boolean, _parts: Iterable<TrStmt>) {
		super();
		this.parts = [..._parts];
	}
	public compile(asm: Assembler, ps: ProgramScope) {
		if (this.block) {
			const h = asm.blockBegin();
			for (const st of this.parts) st.compile(asm, ps);
			asm.blockEnd(h);
		} else {
			for (const st of this.parts) st.compile(asm, ps);
		}
	}
	public willReturnAfter() {
		const last = this.parts[this.parts.length - 1];
		return last && last.willReturnAfter();
	}
	public asFunctionBody(scope: ProgramScope) {
		const pre: TrStmt[] = [new TrEntry()];
		const body = [...this.parts];
		const post: TrStmt[] = [];
		const last = body[body.length - 1];
		if (last && last instanceof TrLastReturn) {
			post[0] = last;
			body.length--;
		} else if (!scope.isProcedure && !this.willReturnAfter()) {
			throw new TypeError(`A function must return.`);
		} else if (scope.isProcedure) {
			post[0] = new TrLastReturn(null);
		}
		return new TrSeq(false, [...pre, new TrSeq(true, body), ...post]);
	}
}
