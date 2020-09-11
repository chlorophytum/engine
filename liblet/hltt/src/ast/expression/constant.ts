import Assembler from "../../asm";
import { PushValue } from "../../asm/asm-instr";
import { Expression } from "../interface";

export class ConstantExpression extends Expression {
	constructor(private x: PushValue) {
		super();
	}
	public readonly arity = 1;
	public compile(asm: Assembler) {
		if (typeof this.x !== "number") asm.refValue(this.x);
		asm.intro(this.x);
	}
	public isConstant() {
		if (typeof this.x === "number") return this.x;
		else return this.x.resolve();
	}
}

export class VolatileExpression extends Expression {
	constructor(private readonly x: Expression) {
		super();
	}
	get arity() {
		return this.x.arity;
	}
	public compile(asm: Assembler) {
		this.x.compile(asm);
	}
}

export function cExpr(x: number | Expression): Expression {
	if (typeof x === "number") return new ConstantExpression(x);
	else return x;
}
export function cExpr1(x: number | Expression): Expression {
	if (typeof x === "number") return new ConstantExpression(x);
	else if (x.arity !== 1) throw new TypeError("Arity>1");
	else return x;
}
