import { TTI } from "@chlorophytum/hltt-next-backend";
import {
	ArithT1G,
	ArithT2,
	ArithT2G,
	castLiteral,
	Expr,
	ExprImpl,
	LogicT1,
	LogicT2
} from "@chlorophytum/hltt-next-expr-impl";
import { TrBinaryOp, TrConst, TrGc, TrNullaryOp, TrUnaryOp } from "@chlorophytum/hltt-next-tr";
import { Bool, Frac, Int, TArith, THandle } from "@chlorophytum/hltt-next-type-system";

export const add = ArithT2G<TArith, number>(
	(x, y) => x + y,
	(x, y) => ExprImpl.create(x.type, TrBinaryOp.Add(x.tr, y.tr))
);

export const sub = ArithT2G<TArith, number>(
	(x, y) => x - y,
	(x, y) => ExprImpl.create(x.type, TrBinaryOp.Sub(x.tr, y.tr))
);

export const mul = ArithT2G<TArith, number>(
	(x, y) => x * y,
	(x, y) =>
		x.type === Int
			? ExprImpl.create(x.type, TrBinaryOp.IMul(x.tr, y.tr))
			: ExprImpl.create(x.type, TrBinaryOp.Mul(x.tr, y.tr))
);

export const div = ArithT2G<TArith, number>(
	(x, y) => x / y,
	(x, y) =>
		x.type === Int
			? ExprImpl.create(x.type, TrBinaryOp.IDiv(x.tr, y.tr))
			: ExprImpl.create(x.type, TrBinaryOp.Div(x.tr, y.tr))
);

export const max = ArithT2G<TArith, number>(
	(x, y) => Math.max(x, y),
	(x, y) => ExprImpl.create(x.type, TrBinaryOp.Max(x.tr, y.tr))
);

export const min = ArithT2G<TArith, number>(
	(x, y) => Math.min(x, y),
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
export const abs = ArithT1G<TArith, number>(
	x => Math.abs(x),
	x => ExprImpl.create(x.type, TrUnaryOp.Abs(x.tr))
);

export const neg = ArithT1G<TArith, number>(
	x => -x,
	x => ExprImpl.create(x.type, TrUnaryOp.Neg(x.tr))
);

export const not = LogicT1(
	x => !x,
	x => ExprImpl.create(Bool, TrUnaryOp.Not(x.tr))
);

export const odd = (x: number | Expr<Frac>) =>
	ExprImpl.create(Bool, TrUnaryOp.Odd(castLiteral(Frac, x).tr));

export const even = (x: number | Expr<Frac>) =>
	ExprImpl.create(Bool, TrUnaryOp.Even(castLiteral(Frac, x).tr));

export const floor = (x: number | Expr<Frac>) =>
	ExprImpl.create(Frac, TrUnaryOp.Floor(castLiteral(Frac, x).tr));

export const ceiling = (x: number | Expr<Frac>) =>
	ExprImpl.create(Frac, TrUnaryOp.Ceiling(castLiteral(Frac, x).tr));

export const round = {
	gray: (x: number | Expr<Frac>) =>
		ExprImpl.create(Frac, TrUnaryOp.RoundGray(castLiteral(Frac, x).tr)),
	black: (x: number | Expr<Frac>) =>
		ExprImpl.create(Frac, TrUnaryOp.RoundBlack(castLiteral(Frac, x).tr)),
	white: (x: number | Expr<Frac>) =>
		ExprImpl.create(Frac, TrUnaryOp.RoundWhite(castLiteral(Frac, x).tr)),
	undef4: (x: number | Expr<Frac>) =>
		ExprImpl.create(Frac, TrUnaryOp.RoundUndef4(castLiteral(Frac, x).tr))
};

export const nRound = {
	gray: (x: number | Expr<Frac>) =>
		ExprImpl.create(Frac, TrUnaryOp.NRoundGray(castLiteral(Frac, x).tr)),
	black: (x: number | Expr<Frac>) =>
		ExprImpl.create(Frac, TrUnaryOp.NRoundBlack(castLiteral(Frac, x).tr)),
	white: (x: number | Expr<Frac>) =>
		ExprImpl.create(Frac, TrUnaryOp.NRoundWhite(castLiteral(Frac, x).tr)),
	undef4: (x: number | Expr<Frac>) =>
		ExprImpl.create(Frac, TrUnaryOp.NRoundUndef4(castLiteral(Frac, x).tr))
};

export const getInfo = (x: number | Expr<Int>) =>
	ExprImpl.create(Int, TrUnaryOp.GetInfo(castLiteral(Int, x).tr));

export const mppem = () => ExprImpl.create(Int, new TrNullaryOp(TTI.MPPEM));
export const mps = () => ExprImpl.create(Frac, new TrNullaryOp(TTI.MPS));

export const i2f = (x: number | Expr<Int>) =>
	ExprImpl.create(Frac, TrBinaryOp.Mul(castLiteral(Int, x).tr, new TrConst(64 * 64)));

export const f2i = (x: number | Expr<Frac>) =>
	ExprImpl.create(Frac, TrBinaryOp.Div(castLiteral(Frac, x).tr, new TrConst(64 * 64)));

export const gc = {
	cur<T extends THandle>(x: Expr<T>) {
		return ExprImpl.create(Frac, new TrGc(x.tr, TTI.GC_cur, x.type.kind === "TwilightPoint"));
	},
	orig<T extends THandle>(x: Expr<T>) {
		return ExprImpl.create(Frac, new TrGc(x.tr, TTI.GC_orig, x.type.kind === "TwilightPoint"));
	}
};
