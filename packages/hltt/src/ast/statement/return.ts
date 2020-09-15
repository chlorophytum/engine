import Assembler from "../../asm";
import { TTI } from "../../instr";
import { cExpr } from "../expression/constant";
import { EdslProgramScope, Expression, Statement } from "../interface";

export class LastReturnStatement extends Statement {
	public readonly parts: Expression[];
	constructor(_parts: Iterable<number | Expression>) {
		super();
		this.parts = [..._parts].map(cExpr);
	}
	public getArgsArity(ps: EdslProgramScope) {
		let argArity = 0;
		for (const st of this.parts) {
			argArity += st.getArity(ps);
		}
		return argArity;
	}
	public willReturnAfter() {
		return true;
	}
	public compile(asm: Assembler, ps: EdslProgramScope) {
		let argArity = this.getArgsArity(ps);
		if (argArity !== (ps.returnArity || 0)) {
			throw new TypeError("Return value arity mismatches");
		}
		for (const st of this.parts) st.compile(asm, ps);

		asm.funcReturnKeepDelete(this.parts.length);
		if (ps.locals.size) {
			asm.intro(ps.globals.sp);
			asm.prim(TTI.DUP).added(1).prim(TTI.RS).deleted(1).added(1);
			asm.intro(ps.locals.size).prim(TTI.SUB).deleted(2).added(1);
			asm.prim(TTI.WS).deleted(2);
		}
	}
}
export class ReturnStatement extends LastReturnStatement {
	public compile(asm: Assembler, ps: EdslProgramScope) {
		if (!ps.return) throw new TypeError("Return label not defined");
		super.compile(asm, ps);
		const here = asm.createLabel();
		asm.push(asm.createLabelDifference(here, ps.return));
		asm.blockBegin(here);
		asm.prim(TTI.JMPR);
		asm.deleted(1);
	}
}
