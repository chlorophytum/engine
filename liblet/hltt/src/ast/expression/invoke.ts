import Assembler from "../../asm";
import { TTI } from "../../instr";
import { EdslProgramScope, Expression, Variable, VkFpgm } from "../interface";

export class InvokeExpression extends Expression {
	constructor(
		private readonly pFunction: Variable<VkFpgm>,
		private readonly parts: Expression[]
	) {
		super();
	}
	getArity(ps: EdslProgramScope) {
		const fn = ps.globals.funcScopeSolver.resolve(this.pFunction);
		if (!fn) return 0;
		else return fn.returnArity || 0;
	}
	public compile(asm: Assembler, ps: EdslProgramScope) {
		let argArity = 1; // Function # is the last arg
		for (const part of this.parts) {
			part.compile(asm, ps);
			argArity += part.getArity(ps);
		}
		const fn = ps.globals.funcScopeSolver.resolve(this.pFunction);
		const fnArgArity = fn ? fn.arguments.size : 0;
		if (fn && argArity !== fnArgArity + 1) {
			throw new TypeError(
				`Function arity for ${this.pFunction} mismatch: ` +
					`Given ${argArity - 1}, Required ${fnArgArity}`
			);
		}
		this.pFunction.compilePtr(asm, ps);
		asm.prim(TTI.CALL);
		asm.deleted(argArity)
			.added(fn ? fn.maxStack : 0)
			.deleted(fn ? fn.maxStack : 0)
			.added(this.getArity(ps));
		asm.forgetRegisters();
	}
}
