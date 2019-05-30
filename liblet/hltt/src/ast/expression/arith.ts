import { TTI } from "../../instr";
import Assembler from "../../ir";
import { Expression } from "../interface";

import { cExpr1 } from "./constant";

export class BinaryExpression extends Expression {
	private readonly a: Expression;
	private readonly b: Expression;
	constructor(
		_a: number | Expression,
		private readonly op: TTI,
		_b: number | Expression,
		private readonly fold?: (a: number, b: number) => number | undefined
	) {
		super();
		this.a = cExpr1(_a);
		this.b = cExpr1(_b);
	}
	readonly arity = 1;
	constant() {
		const ca = this.a.constant();
		const cb = this.b.constant();
		if (!this.fold || ca === undefined || cb === undefined) return undefined;
		else return this.fold(ca, cb);
	}
	refer(asm: Assembler) {
		this.a.refer(asm);
		this.b.refer(asm);
	}
	compile(asm: Assembler) {
		this.a.compile(asm);
		this.b.compile(asm);
		asm.prim(this.op)
			.deleted(2)
			.added(1);
	}

	static Add(_a: number | Expression, _b: number | Expression) {
		return new BinaryExpression(_a, TTI.ADD, _b, (a, b) => a + b);
	}
	static Sub(_a: number | Expression, _b: number | Expression) {
		return new BinaryExpression(_a, TTI.SUB, _b, (a, b) => a - b);
	}
	static Mul(_a: number | Expression, _b: number | Expression) {
		return new BinaryExpression(_a, TTI.MUL, _b, (a, b) => ((a * b) / 64) | 0);
	}
	static Div(_a: number | Expression, _b: number | Expression) {
		return new BinaryExpression(_a, TTI.DIV, _b, (a, b) => ((a / b) * 64) | 0);
	}
	static Max(_a: number | Expression, _b: number | Expression) {
		return new BinaryExpression(_a, TTI.MAX, _b, (a, b) => Math.max(a, b));
	}
	static Min(_a: number | Expression, _b: number | Expression) {
		return new BinaryExpression(_a, TTI.MIN, _b, (a, b) => Math.min(a, b));
	}
	static Lt(_a: number | Expression, _b: number | Expression) {
		return new BinaryExpression(_a, TTI.LT, _b, (a, b) => (a < b ? 1 : 0));
	}
	static Lteq(_a: number | Expression, _b: number | Expression) {
		return new BinaryExpression(_a, TTI.LTEQ, _b, (a, b) => (a <= b ? 1 : 0));
	}
	static Gt(_a: number | Expression, _b: number | Expression) {
		return new BinaryExpression(_a, TTI.GT, _b, (a, b) => (a > b ? 1 : 0));
	}
	static Gteq(_a: number | Expression, _b: number | Expression) {
		return new BinaryExpression(_a, TTI.GTEQ, _b, (a, b) => (a >= b ? 1 : 0));
	}
	static Eq(_a: number | Expression, _b: number | Expression) {
		return new BinaryExpression(_a, TTI.EQ, _b, (a, b) => (a === b ? 1 : 0));
	}
	static Neq(_a: number | Expression, _b: number | Expression) {
		return new BinaryExpression(_a, TTI.NEQ, _b, (a, b) => (a !== b ? 1 : 0));
	}
	static And(_a: number | Expression, _b: number | Expression) {
		return new BinaryExpression(_a, TTI.AND, _b, (a, b) => (a && b ? 1 : 0));
	}
	static Or(_a: number | Expression, _b: number | Expression) {
		return new BinaryExpression(_a, TTI.OR, _b, (a, b) => (a || b ? 1 : 0));
	}
}

export class UnaryExpression extends Expression {
	private readonly a: Expression;
	constructor(
		private readonly op: TTI,
		_a: number | Expression,
		private readonly fold?: (a: number) => number | undefined
	) {
		super();
		this.a = cExpr1(_a);
	}
	readonly arity = 1;
	constant() {
		const ca = this.a.constant();
		if (!this.fold || ca === undefined) return undefined;
		else return this.fold(ca);
	}
	refer(asm: Assembler) {
		this.a.refer(asm);
	}
	compile(asm: Assembler) {
		this.a.compile(asm);
		asm.prim(this.op)
			.deleted(1)
			.added(1);
	}
}

export class NullaryExpression extends Expression {
	constructor(private readonly op: TTI) {
		super();
	}
	readonly arity = 1;
	constant() {
		return undefined;
	}
	refer(asm: Assembler) {}
	compile(asm: Assembler) {
		asm.prim(this.op).added(1);
	}
}
