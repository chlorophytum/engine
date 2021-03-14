import { TrBinaryOp } from "../../tr/exp/arith";
import { TrConst } from "../../tr/exp/const";
import { TrCvt, TrCvtPtr, TrLocalPtr, TrOffsetPtr, TrStorage } from "../../tr/exp/variable";
import { TrExp } from "../../tr/tr";
import { Expr, ExprAll, ExprVarCvtAll, ExprVarStore, ExprVarStoreAll } from "../expr";
import {
	Bool,
	Cvt,
	Frac,
	GlyphPoint,
	Int,
	Store,
	TT,
	TwilightPoint,
	UniFrac
} from "../type-system";

// Impl classes
export function castArithLiteral<T extends TT>(ty: T, x: number): Expr<T> {
	if (ty === Int) return ExprImpl.create(ty, new TrConst(x));
	if (ty === Frac) return ExprImpl.create(ty, new TrConst(x * 64));
	if (ty === UniFrac) return ExprImpl.create(ty, new TrConst(x * (1 << 14)));
	if (ty === GlyphPoint) return ExprImpl.create(ty, new TrConst(x));
	if (ty === TwilightPoint) return ExprImpl.create(ty, new TrConst(x));
	throw new TypeError(`Cannot convert number literal to ${ty}`);
}

export function castBoolLiteral<T extends TT>(ty: T, x: boolean): Expr<T> {
	if (ty === Bool) return ExprImpl.create(ty, new TrConst(x ? 1 : 0));
	throw new TypeError(`Cannot convert boolean literal to ${ty}`);
}

export function castLiteral<T extends TT>(ty: T, x: number | boolean | Expr<T>) {
	if (x === undefined || !ty) throw new TypeError("Arity mismatch");
	if (typeof x === "number") return castArithLiteral(ty, x);
	if (typeof x === "boolean") return castBoolLiteral(ty, x);
	if (x.type.id !== ty.id) throw new TypeError("Type mismatch");
	return x;
}

export function cast<T2 extends TT, T1 extends TT>(
	ty: T2,
	x: number | boolean | Expr<T1>
): Expr<T2> {
	if (typeof x === "number") return castArithLiteral(ty, x);
	if (typeof x === "boolean") return castBoolLiteral(ty, x);
	if (x.type === Int && ty === Frac)
		return ExprImpl.create(ty, TrBinaryOp.Mul(x.tr, new TrConst(64 * 64)));
	if (x.type === Frac && ty === Int)
		return ExprImpl.create(ty, TrBinaryOp.Div(x.tr, new TrConst(64 * 64)));
	throw new TypeError(`Cannot cast ${x.type} to ${ty}`);
}

export function unsafeCoerce<T2 extends TT, T1 extends TT>(t1: T2, x: Expr<T1>): Expr<T2> {
	return ExprImpl.create(t1, x.tr);
}

export class ExprImpl<T extends TT> implements ExprAll<T> {
	protected constructor(public readonly type: T, public readonly tr: TrExp) {}
	static create<T extends TT>(type: T, ir: TrExp) {
		return (new ExprImpl(type, ir) as unknown) as Expr<T>;
	}
	part(n: number | Expr<Int>) {
		const ty: TT = this.type;
		if (ty.kind === "Store")
			return new ExprImpl(
				ty.member,
				new TrStorage(TrOffsetPtr.from(this.tr, castLiteral(Int, n).tr))
			);
		if (ty.kind === "Cvt")
			return new ExprImpl(
				ty.member,
				new TrCvt(TrOffsetPtr.from(this.tr, castLiteral(Int, n).tr))
			);
		throw new TypeError("Cannot use deRef on non-pointer types");
	}
	get deRef() {
		return this.part(0);
	}
}

export class LocalVarExprImpl<T extends TT> extends ExprImpl<T> implements ExprVarStoreAll<T> {
	protected constructor(type: T, symbol: symbol) {
		super(type, new TrStorage(new TrLocalPtr(symbol, 0)));
		this.symbol = symbol;
	}

	private readonly symbol: symbol;

	get ptr() {
		return this.offsetPtr(0);
	}
	offsetPtr(n: number | Expr<Int>) {
		return new ExprImpl<Store<T>>(
			Store(this.type),
			TrOffsetPtr.from(new TrLocalPtr(this.symbol, 0), castLiteral(Int, n).tr)
		);
	}

	static fromSymbol<T extends TT>(ty: T, s: symbol): Expr<T> & ExprVarStore<T> {
		return (new LocalVarExprImpl(ty, s) as unknown) as Expr<T> & ExprVarStore<T>;
	}
}

export class CvtExprImpl<T extends TT> extends ExprImpl<T> implements ExprVarCvtAll<T> {
	protected constructor(type: T, symbol: symbol) {
		super(type, new TrCvt(new TrCvtPtr(symbol, 0)));
		this.symbol = symbol;
	}

	private readonly symbol: symbol;

	get ptr() {
		return this.offsetPtr(0);
	}
	offsetPtr(n: number | Expr<Int>) {
		return new ExprImpl<Cvt<T>>(
			Cvt(this.type),
			TrOffsetPtr.from(new TrCvtPtr(this.symbol, 0), castLiteral(Int, n).tr)
		);
	}
}
