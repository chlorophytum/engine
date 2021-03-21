import { Bool, TT } from "@chlorophytum/hltt-next-type-system";

import { Expr } from "../interfaces";

import { castArithLiteral, castLiteral } from "./expr";

export function ArithT2<TA extends TT, R extends TT, RN>(
	foldN: (a: number, b: number) => RN,
	foldE: (a: Expr<TA>, b: Expr<TA>) => Expr<R>
) {
	return function <T extends TA>(a: number | Expr<T>, b: number | Expr<T>): RN | Expr<R> {
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

export function ArithT2G<TA extends TT, RN>(
	foldN: (a: number, b: number) => RN,
	foldE: <T extends TA>(a: Expr<T>, b: Expr<T>) => Expr<T>
) {
	return function <T extends TA>(a: number | Expr<T>, b: number | Expr<T>): RN | Expr<T> {
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

export function ArithT1G<TA extends TT, RN>(
	foldN: (a: number) => RN,
	foldE: <T extends TA>(a: Expr<T>) => Expr<T>
) {
	return function <T extends TA>(a: number | Expr<T>): RN | Expr<T> {
		if (typeof a === "number") {
			return foldN(a);
		} else {
			return foldE(a);
		}
	};
}

export function LogicT2<R extends TT, RN>(
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

export function LogicT1<R extends TT, RN>(
	foldN: (a: boolean) => RN,
	foldE: (a: Expr<Bool>) => Expr<R>
) {
	return function (a: boolean | Expr<Bool>): RN | Expr<R> {
		if (typeof a === "boolean") {
			return foldN(a);
		} else {
			return foldE(a);
		}
	};
}
