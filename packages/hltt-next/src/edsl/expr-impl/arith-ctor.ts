import { TTI } from "../../instr";
import { TrBinaryOp, TrNullaryOp, TrUnaryOp } from "../../tr/exp/arith";
import { TrConst } from "../../tr/exp/const";
import { Expr } from "../expr";
import { Bool, Frac, Int, TArith, TT } from "../type-system";

import { castArithLiteral, castLiteral, ExprImpl } from "./expr";

function ArithT2<T extends TT, R extends TT, RN>(
	foldN: (a: number, b: number) => RN,
	foldE: (a: Expr<T>, b: Expr<T>) => Expr<R>
) {
	return function (a: number | Expr<T>, b: number | Expr<T>): RN | Expr<R> {
		if (typeof a === "number") {
			if (typeof b === "number") {
				return foldN(a, b);
			} else {
				return foldE(castArithLiteral(b.type, a), b);
			}
		} else {
			if (typeof b === "number") {
				return foldE(a, castArithLiteral(a.type, b));
			} else {
				return foldE(a, b);
			}
		}
	};
}

function ArithT1<T extends TT, R extends TT, RN>(
	foldN: (a: number) => RN,
	foldE: (a: Expr<T>) => Expr<R>
) {
	return function (a: number | Expr<T>): RN | Expr<R> {
		if (typeof a === "number") {
			return foldN(a);
		} else {
			return foldE(a);
		}
	};
}

function LogicT2<R extends TT, RN>(
	foldN: (a: boolean, b: boolean) => RN,
	foldE: (a: Expr<Bool>, b: Expr<Bool>) => Expr<R>
) {
	return function (a: boolean | Expr<Bool>, b: boolean | Expr<Bool>): RN | Expr<R> {
		if (typeof a === "boolean" && typeof b === "boolean") {
			return foldN(a, b);
		} else {
			return foldE(castLiteral(Bool, a), castLiteral(Bool, b));
		}
	};
}

function LogicT1<R extends TT, RN>(foldN: (a: boolean) => RN, foldE: (a: Expr<Bool>) => Expr<R>) {
	return function (a: boolean | Expr<Bool>): RN | Expr<R> {
		if (typeof a === "boolean") {
			return foldN(a);
		} else {
			return foldE(a);
		}
	};
}

export const add = ArithT2<TArith, TArith, number>(
	(x, y) => x + y,
	(x, y) => ExprImpl.create(x.type, TrBinaryOp.Add(x.tr, y.tr))
);

export const sub = ArithT2<TArith, TArith, number>(
	(x, y) => x - y,
	(x, y) => ExprImpl.create(x.type, TrBinaryOp.Add(x.tr, y.tr))
);

export const mul = ArithT2<TArith, TArith, number>(
	(x, y) => x * y,
	(x, y) =>
		x.type === Int
			? ExprImpl.create(x.type, TrBinaryOp.IMul(x.tr, y.tr))
			: ExprImpl.create(x.type, TrBinaryOp.Mul(x.tr, y.tr))
);

export const div = ArithT2<TArith, TArith, number>(
	(x, y) => x / y,
	(x, y) =>
		x.type === Int
			? ExprImpl.create(x.type, TrBinaryOp.IDiv(x.tr, y.tr))
			: ExprImpl.create(x.type, TrBinaryOp.Div(x.tr, y.tr))
);

export const max = ArithT2<TArith, TArith, number>(
	(x, y) => Math.max(x + y),
	(x, y) => ExprImpl.create(x.type, TrBinaryOp.Max(x.tr, y.tr))
);

export const min = ArithT2<TArith, TArith, number>(
	(x, y) => Math.max(x - y),
	(x, y) => ExprImpl.create(x.type, TrBinaryOp.Min(x.tr, y.tr))
);

export const lt = ArithT2<TArith, Bool, boolean>(
	(x, y) => x < y,
	(x, y) => ExprImpl.create(Bool, TrBinaryOp.Lt(x.tr, y.tr))
);

export const lteq = ArithT2<TArith, Bool, boolean>(
	(x, y) => x <= y,
	(x, y) => ExprImpl.create(Bool, TrBinaryOp.Lteq(x.tr, y.tr))
);

export const gt = ArithT2<TArith, Bool, boolean>(
	(x, y) => x > y,
	(x, y) => ExprImpl.create(Bool, TrBinaryOp.Gt(x.tr, y.tr))
);

export const gteq = ArithT2<TArith, Bool, boolean>(
	(x, y) => x >= y,
	(x, y) => ExprImpl.create(Bool, TrBinaryOp.Gteq(x.tr, y.tr))
);

export const eq = ArithT2<TArith, Bool, boolean>(
	(x, y) => x === y,
	(x, y) => ExprImpl.create(Bool, TrBinaryOp.Eq(x.tr, y.tr))
);

export const neq = ArithT2<TArith, Bool, boolean>(
	(x, y) => x !== y,
	(x, y) => ExprImpl.create(Bool, TrBinaryOp.Neq(x.tr, y.tr))
);

export const and = LogicT2<Bool, boolean>(
	(x, y) => x && y,
	(x, y) => ExprImpl.create(Bool, TrBinaryOp.And(x.tr, y.tr))
);

export const or = LogicT2<Bool, boolean>(
	(x, y) => x || y,
	(x, y) => ExprImpl.create(Bool, TrBinaryOp.Or(x.tr, y.tr))
);

// Unary
export const abs = ArithT1<TArith, TArith, number>(
	x => Math.abs(x),
	x => ExprImpl.create(x.type, TrUnaryOp.Abs(x.tr))
);

export const neg = ArithT1<TArith, TArith, number>(
	x => -x,
	x => ExprImpl.create(x.type, TrUnaryOp.Neg(x.tr))
);

export const odd = (x: number | Expr<Frac>) =>
	ExprImpl.create(Bool, TrUnaryOp.Odd(castLiteral(Frac, x).tr));

export const even = (x: number | Expr<Frac>) =>
	ExprImpl.create(Bool, TrUnaryOp.Even(castLiteral(Frac, x).tr));

export const floor = (x: number | Expr<Frac>) =>
	ExprImpl.create(Frac, TrUnaryOp.Floor(castLiteral(Frac, x).tr));

export const ceiling = (x: number | Expr<Frac>) =>
	ExprImpl.create(Frac, TrUnaryOp.Ceiling(castLiteral(Frac, x).tr));

export const roundGray = (x: number | Expr<Frac>) =>
	ExprImpl.create(Frac, TrUnaryOp.RoundGray(castLiteral(Frac, x).tr));

export const roundBlack = (x: number | Expr<Frac>) =>
	ExprImpl.create(Frac, TrUnaryOp.RoundBlack(castLiteral(Frac, x).tr));

export const roundWhite = (x: number | Expr<Frac>) =>
	ExprImpl.create(Frac, TrUnaryOp.RoundWhite(castLiteral(Frac, x).tr));

export const roundUndef4 = (x: number | Expr<Frac>) =>
	ExprImpl.create(Frac, TrUnaryOp.RoundUndef4(castLiteral(Frac, x).tr));

export const nRoundGray = (x: number | Expr<Frac>) =>
	ExprImpl.create(Frac, TrUnaryOp.NRoundGray(castLiteral(Frac, x).tr));

export const nRoundBlack = (x: number | Expr<Frac>) =>
	ExprImpl.create(Frac, TrUnaryOp.NRoundBlack(castLiteral(Frac, x).tr));

export const nRoundWhite = (x: number | Expr<Frac>) =>
	ExprImpl.create(Frac, TrUnaryOp.NRoundWhite(castLiteral(Frac, x).tr));

export const nRoundUndef4 = (x: number | Expr<Frac>) =>
	ExprImpl.create(Frac, TrUnaryOp.NRoundUndef4(castLiteral(Frac, x).tr));

export const getInfo = (x: number | Expr<Int>) =>
	ExprImpl.create(Int, TrUnaryOp.GetInfo(castLiteral(Int, x).tr));

export const mppem = () => ExprImpl.create(Int, new TrNullaryOp(TTI.MPPEM));
export const mps = () => ExprImpl.create(Frac, new TrNullaryOp(TTI.MPS));

export const i2f = (x: number | Expr<Int>) =>
	ExprImpl.create(Frac, TrBinaryOp.Mul(castLiteral(Int, x).tr, new TrConst(64 * 64)));

export const f2i = (x: number | Expr<Frac>) =>
	ExprImpl.create(Frac, TrBinaryOp.Div(castLiteral(Frac, x).tr, new TrConst(64 * 64)));
