import { TTI } from "../../instr";
import Assembler from "../../ir";
import { ProgramScope } from "../../scope";
import { cExpr } from "../expression/constant";
import { Expression, Statement, Variable } from "../interface";

export class LastReturnStatement extends Statement {
	readonly parts: Expression[];
	constructor(
		protected readonly scope: ProgramScope<Variable>,
		_parts: Iterable<number | Expression>
	) {
		super();
		this.parts = [..._parts].map(cExpr);
	}
	getArgsArity() {
		let argArity = 0;
		for (const st of this.parts) {
			argArity += st.arity;
		}
		return argArity;
	}
	refer(asm: Assembler) {
		for (const part of this.parts) part.refer(asm);
	}
	willReturnAfter() {
		return true;
	}
	compile(asm: Assembler) {
		let argArity = this.getArgsArity();
		if (argArity !== (this.scope.returnArity || 0)) {
			throw new TypeError("Return value arity mismatches");
		}
		for (const st of this.parts) st.compile(asm);

		asm.funcReturnKeepDelete(this.parts.length);
		if (this.scope.locals.size) {
			asm.intro(this.scope.globals.sp);
			asm.prim(TTI.DUP)
				.added(1)
				.prim(TTI.RS)
				.deleted(1)
				.added(1);
			asm.intro(this.scope.locals.size)
				.prim(TTI.SUB)
				.deleted(2)
				.added(1);
			asm.prim(TTI.WS).deleted(2);
		}
	}
}
export class ReturnStatement extends LastReturnStatement {
	compile(asm: Assembler) {
		if (!this.scope.return) throw new TypeError("Return label not defined");
		super.compile(asm);
		const here = asm.createLabel();
		asm.push(asm.createLabelDifference(here, this.scope.return));
		asm.blockBegin(here);
		asm.prim(TTI.JMPR);
		asm.deleted(1);
	}
}