import { TTI } from "../../instr";
import Assembler from "../../ir";
import { ProgramScope } from "../../scope";
import { Expression, Variable } from "../interface";

import { cExpr } from "./constant";

export class InvokeExpression extends Expression {
	private readonly parts: Expression[];
	constructor(
		private readonly scope: ProgramScope<Variable>,
		private readonly pFunction: Variable,
		_parts: Iterable<number | Expression>
	) {
		super();
		this.parts = [..._parts].map(cExpr);
	}
	get arity() {
		const fn = this.scope.globals.funcScopeSolver.resolve(this.pFunction);
		if (!fn) return 0;
		else return fn.returnArity || 0;
	}
	refer(asm: Assembler) {
		for (const part of this.parts) part.refer(asm);
	}
	compile(asm: Assembler) {
		let argArity = 1; // Function # is the last arg
		for (const part of this.parts) {
			part.compile(asm);
			argArity += part.arity;
		}
		const fn = this.scope.globals.funcScopeSolver.resolve(this.pFunction);
		const fnArgArity = fn ? fn.arguments.size : 0;
		if (fn && argArity !== fnArgArity + 1) {
			throw new TypeError(
				`Function arity mismatch: Given ${argArity - 1}, Required ${fnArgArity}`
			);
		}
		this.pFunction.compilePtr(asm);
		asm.prim(TTI.CALL);
		asm.deleted(argArity)
			.added(fn ? fn.maxStack : 0)
			.deleted(fn ? fn.maxStack : 0)
			.added(this.arity);
		asm.forgetRegisters();
	}
}
