import Assembler from "../../asm";
import { PushValue } from "../../asm/asm-instr";
import { EdslProgramScope, Expression, PtrExpression, VarKind } from "../interface";

export class ConstantExpression extends Expression {
	constructor(private x: PushValue) {
		super();
	}
	public getArity() {
		return 1;
	}
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
	getArity(ps: EdslProgramScope) {
		return this.x.getArity(ps);
	}
	public compile(asm: Assembler, ps: EdslProgramScope) {
		this.x.compile(asm, ps);
	}
}

export function cExpr(x: number | Expression): Expression {
	if (typeof x === "number") return new ConstantExpression(x);
	else return x;
}
export function cExprArr(x: Iterable<number | Expression>): Expression[] {
	return Array.from(x).map(cExpr);
}
