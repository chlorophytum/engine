import Assembler from "../../asm";
import { TTI } from "../../instr";
import { EdslProgramScope, Expression } from "../interface";

export class BinaryExpression extends Expression {
	constructor(
		private readonly a: Expression,
		private readonly op: TTI,
		private readonly b: Expression,
		private readonly fold?: (a: number, b: number) => number | undefined
	) {
		super();
	}
	public getArity() {
		return 1;
	}
	public isConstant() {
		const ca = this.a.isConstant();
		const cb = this.b.isConstant();
		if (!this.fold || ca === undefined || cb === undefined) return undefined;
		else return this.fold(ca, cb);
	}
	public compile(asm: Assembler, ps: EdslProgramScope) {
		if (this.a.getArity(ps) != 1) throw new TypeError("Argument arity must be 1.");
		if (this.b.getArity(ps) != 1) throw new TypeError("Argument arity must be 1.");
		this.a.compile(asm, ps);
		this.b.compile(asm, ps);
		asm.prim(this.op).deleted(2).added(1);
	}

	public static Add(_a: Expression, _b: Expression) {
		return new BinaryExpression(_a, TTI.ADD, _b, (a, b) => a + b);
	}
	public static Sub(_a: Expression, _b: Expression) {
		return new BinaryExpression(_a, TTI.SUB, _b, (a, b) => a - b);
	}
	public static Mul(_a: Expression, _b: Expression) {
		return new BinaryExpression(_a, TTI.MUL, _b, (a, b) => ((a * b) / 64) | 0);
	}
	public static Div(_a: Expression, _b: Expression) {
		return new BinaryExpression(_a, TTI.DIV, _b, (a, b) => ((a / b) * 64) | 0);
	}
	public static Max(_a: Expression, _b: Expression) {
		return new BinaryExpression(_a, TTI.MAX, _b, (a, b) => Math.max(a, b));
	}
	public static Min(_a: Expression, _b: Expression) {
		return new BinaryExpression(_a, TTI.MIN, _b, (a, b) => Math.min(a, b));
	}
	public static Lt(_a: Expression, _b: Expression) {
		return new BinaryExpression(_a, TTI.LT, _b, (a, b) => (a < b ? 1 : 0));
	}
	public static Lteq(_a: Expression, _b: Expression) {
		return new BinaryExpression(_a, TTI.LTEQ, _b, (a, b) => (a <= b ? 1 : 0));
	}
	public static Gt(_a: Expression, _b: Expression) {
		return new BinaryExpression(_a, TTI.GT, _b, (a, b) => (a > b ? 1 : 0));
	}
	public static Gteq(_a: Expression, _b: Expression) {
		return new BinaryExpression(_a, TTI.GTEQ, _b, (a, b) => (a >= b ? 1 : 0));
	}
	public static Eq(_a: Expression, _b: Expression) {
		return new BinaryExpression(_a, TTI.EQ, _b, (a, b) => (a === b ? 1 : 0));
	}
	public static Neq(_a: Expression, _b: Expression) {
		return new BinaryExpression(_a, TTI.NEQ, _b, (a, b) => (a !== b ? 1 : 0));
	}
	public static And(_a: Expression, _b: Expression) {
		return new BinaryExpression(_a, TTI.AND, _b, (a, b) => (a && b ? 1 : 0));
	}
	public static Or(_a: Expression, _b: Expression) {
		return new BinaryExpression(_a, TTI.OR, _b, (a, b) => (a || b ? 1 : 0));
	}
}

export class UnaryExpression extends Expression {
	constructor(
		private readonly op: TTI,
		private readonly a: Expression,
		private readonly fold?: (a: number) => number | undefined
	) {
		super();
	}
	public getArity() {
		return 1;
	}
	public isConstant() {
		const ca = this.a.isConstant();
		if (!this.fold || ca === undefined) return undefined;
		else return this.fold(ca);
	}
	public compile(asm: Assembler, ps: EdslProgramScope) {
		if (this.a.getArity(ps) != 1) throw new TypeError("Argument arity must be 1.");
		this.a.compile(asm, ps);
		asm.prim(this.op).deleted(1).added(1);
	}

	public static Abs(a: Expression) {
		return new UnaryExpression(TTI.ABS, a, a => Math.abs(a));
	}
	public static Neg(a: Expression) {
		return new UnaryExpression(TTI.NEG, a, a => -a);
	}
	public static Floor(a: Expression) {
		return new UnaryExpression(TTI.FLOOR, a, a => Math.floor(a / 64) * 64);
	}
	public static Ceiling(a: Expression) {
		return new UnaryExpression(TTI.CEILING, a, a => Math.ceil(a / 64) * 64);
	}
	public static Even(a: Expression) {
		return new UnaryExpression(TTI.EVEN, a);
	}
	public static Odd(a: Expression) {
		return new UnaryExpression(TTI.ODD, a);
	}
	public static Not(a: Expression) {
		return new UnaryExpression(TTI.NOT, a, a => (a ? 0 : 1));
	}
	public static RoundGray(a: Expression) {
		return new UnaryExpression(TTI.ROUND_Grey, a);
	}
	public static RoundBlack(a: Expression) {
		return new UnaryExpression(TTI.ROUND_Black, a);
	}
	public static RoundWhite(a: Expression) {
		return new UnaryExpression(TTI.ROUND_White, a);
	}
	public static RoundUndef4(a: Expression) {
		return new UnaryExpression(TTI.ROUND_Undef4, a);
	}
	public static NRoundGray(a: Expression) {
		return new UnaryExpression(TTI.NROUND_Grey, a);
	}
	public static NRoundBlack(a: Expression) {
		return new UnaryExpression(TTI.NROUND_Black, a);
	}
	public static NRoundWhite(a: Expression) {
		return new UnaryExpression(TTI.NROUND_White, a);
	}
	public static NRoundUndef4(a: Expression) {
		return new UnaryExpression(TTI.NROUND_Undef4, a);
	}
	public static GetInfo(a: Expression) {
		return new UnaryExpression(TTI.GETINFO, a);
	}
}

export class NullaryExpression extends Expression {
	constructor(private readonly op: TTI) {
		super();
	}
	public getArity() {
		return 1;
	}
	public isConstant() {
		return undefined;
	}
	public compile(asm: Assembler) {
		asm.prim(this.op).added(1);
	}
}
