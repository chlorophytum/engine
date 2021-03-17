import { Assembler, TTI } from "@chlorophytum/hltt-next-backend";

import { ProgramScope } from "../scope";
import { TrExp } from "../tr";

import { TrConst } from "./const";

export class TrBinaryOp implements TrExp {
	constructor(
		private readonly a: TrExp,
		private readonly op: TTI,
		private readonly b: TrExp,
		private readonly fold?: (a: number, b: number) => number | undefined
	) {}
	public isConstant() {
		if (!this.fold) return undefined;
		const ca = this.a.isConstant();
		const cb = this.b.isConstant();
		if (ca === undefined || cb === undefined) return undefined;
		else return this.fold(ca, cb);
	}
	public compile(asm: Assembler, ps: ProgramScope) {
		const cx = this.isConstant();
		if (cx !== undefined) {
			asm.intro(cx);
		} else {
			this.a.compile(asm, ps);
			this.b.compile(asm, ps);
			asm.prim(this.op).deleted(2).added(1);
		}
	}

	public static Add(_a: TrExp, _b: TrExp) {
		return new TrBinaryOp(_a, TTI.ADD, _b, (a, b) => a + b);
	}
	public static Sub(_a: TrExp, _b: TrExp) {
		return new TrBinaryOp(_a, TTI.SUB, _b, (a, b) => a - b);
	}
	public static Mul(_a: TrExp, _b: TrExp) {
		return new TrBinaryOp(_a, TTI.MUL, _b, (a, b) => ((a * b) / 64) | 0);
	}
	public static IMul(a: TrExp, b: TrExp) {
		if (a instanceof TrConst) {
			return TrBinaryOp.Mul(new TrConst(a.value * 64), b);
		} else if (b instanceof TrConst) {
			return TrBinaryOp.Mul(a, new TrConst(b.value * 64));
		} else {
			return TrBinaryOp.Mul(a, TrBinaryOp.Mul(b, new TrConst(64 * 64)));
		}
	}
	public static Div(_a: TrExp, _b: TrExp) {
		return new TrBinaryOp(_a, TTI.DIV, _b, (a, b) => ((a / b) * 64) | 0);
	}
	public static IDiv(a: TrExp, b: TrExp) {
		return TrBinaryOp.Div(TrBinaryOp.Div(a, b), new TrConst(64 * 64));
	}
	public static Max(_a: TrExp, _b: TrExp) {
		return new TrBinaryOp(_a, TTI.MAX, _b, (a, b) => Math.max(a, b));
	}
	public static Min(_a: TrExp, _b: TrExp) {
		return new TrBinaryOp(_a, TTI.MIN, _b, (a, b) => Math.min(a, b));
	}
	public static Lt(_a: TrExp, _b: TrExp) {
		return new TrBinaryOp(_a, TTI.LT, _b, (a, b) => (a < b ? 1 : 0));
	}
	public static Lteq(_a: TrExp, _b: TrExp) {
		return new TrBinaryOp(_a, TTI.LTEQ, _b, (a, b) => (a <= b ? 1 : 0));
	}
	public static Gt(_a: TrExp, _b: TrExp) {
		return new TrBinaryOp(_a, TTI.GT, _b, (a, b) => (a > b ? 1 : 0));
	}
	public static Gteq(_a: TrExp, _b: TrExp) {
		return new TrBinaryOp(_a, TTI.GTEQ, _b, (a, b) => (a >= b ? 1 : 0));
	}
	public static Eq(_a: TrExp, _b: TrExp) {
		return new TrBinaryOp(_a, TTI.EQ, _b, (a, b) => (a === b ? 1 : 0));
	}
	public static Neq(_a: TrExp, _b: TrExp) {
		return new TrBinaryOp(_a, TTI.NEQ, _b, (a, b) => (a !== b ? 1 : 0));
	}
	public static And(_a: TrExp, _b: TrExp) {
		return new TrBinaryOp(_a, TTI.AND, _b, (a, b) => (a && b ? 1 : 0));
	}
	public static Or(_a: TrExp, _b: TrExp) {
		return new TrBinaryOp(_a, TTI.OR, _b, (a, b) => (a || b ? 1 : 0));
	}
}

export class TrUnaryOp implements TrExp {
	constructor(
		private readonly op: TTI,
		private readonly a: TrExp,
		private readonly fold?: (a: number) => number | undefined
	) {}
	public isConstant() {
		const ca = this.a.isConstant();
		if (!this.fold || ca === undefined) return undefined;
		else return this.fold(ca);
	}
	public compile(asm: Assembler, ps: ProgramScope) {
		const cx = this.isConstant();
		if (cx !== undefined) {
			asm.intro(cx);
		} else {
			this.a.compile(asm, ps);
			asm.prim(this.op).deleted(1).added(1);
		}
	}

	public static Abs(a: TrExp) {
		return new TrUnaryOp(TTI.ABS, a, a => Math.abs(a));
	}
	public static Neg(a: TrExp) {
		return new TrUnaryOp(TTI.NEG, a, a => -a);
	}
	public static Floor(a: TrExp) {
		return new TrUnaryOp(TTI.FLOOR, a, a => Math.floor(a / 64) * 64);
	}
	public static Ceiling(a: TrExp) {
		return new TrUnaryOp(TTI.CEILING, a, a => Math.ceil(a / 64) * 64);
	}
	public static Even(a: TrExp) {
		return new TrUnaryOp(TTI.EVEN, a);
	}
	public static Odd(a: TrExp) {
		return new TrUnaryOp(TTI.ODD, a);
	}
	public static Not(a: TrExp) {
		return new TrUnaryOp(TTI.NOT, a, a => (a ? 0 : 1));
	}
	public static RoundGray(a: TrExp) {
		return new TrUnaryOp(TTI.ROUND_Grey, a);
	}
	public static RoundBlack(a: TrExp) {
		return new TrUnaryOp(TTI.ROUND_Black, a);
	}
	public static RoundWhite(a: TrExp) {
		return new TrUnaryOp(TTI.ROUND_White, a);
	}
	public static RoundUndef4(a: TrExp) {
		return new TrUnaryOp(TTI.ROUND_Undef4, a);
	}
	public static NRoundGray(a: TrExp) {
		return new TrUnaryOp(TTI.NROUND_Grey, a);
	}
	public static NRoundBlack(a: TrExp) {
		return new TrUnaryOp(TTI.NROUND_Black, a);
	}
	public static NRoundWhite(a: TrExp) {
		return new TrUnaryOp(TTI.NROUND_White, a);
	}
	public static NRoundUndef4(a: TrExp) {
		return new TrUnaryOp(TTI.NROUND_Undef4, a);
	}
	public static GetInfo(a: TrExp) {
		return new TrUnaryOp(TTI.GETINFO, a);
	}
}

export class TrNullaryOp implements TrExp {
	constructor(private readonly op: TTI) {}
	public isConstant() {
		return undefined;
	}
	public compile(asm: Assembler) {
		asm.prim(this.op).added(1);
	}
}
