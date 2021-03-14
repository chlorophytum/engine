import { TrBinaryOp } from "../../tr/exp/arith";
import { TrConst } from "../../tr/exp/const";
import { TrCvt, TrCvtPtr, TrLocalPtr, TrOffsetPtr, TrStorage } from "../../tr/exp/variable";
import { TrSetVariable } from "../../tr/stmt/set-variable";
import { TrExp, TrVar } from "../../tr/tr";
import { Expr, ExprAll, ExprVarAll, ExprVarStore } from "../expr";
import { Stmt } from "../stmt";
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
export class ExprImpl implements ExprAll {
	protected constructor(public readonly type: TT, public readonly tr: TrExp) {}
	static create<T extends TT>(type: T, ir: TrExp) {
		return (new ExprImpl(type, ir) as unknown) as Expr<T>;
	}
	part(n: number | ExprAll) {
		const ty: TT = this.type;
		if (ty.kind === "Store")
			return new CoercedVarImpl(ty.member, Store, TrStorage, this.tr, castLiteral(Int, n).tr);
		if (ty.kind === "Cvt")
			return new CoercedVarImpl(ty.member, Cvt, TrCvt, this.tr, castLiteral(Int, n).tr);
		throw new TypeError("Cannot use deRef on non-pointer types");
	}
	get deRef() {
		return this.part(0);
	}
}

class CoercedVarImpl extends ExprImpl implements ExprVarAll {
	public constructor(
		type: TT,
		private readonly ptrCon: (ty: TT) => TT,
		private readonly CAccess: { new (tr: TrExp): TrVar },
		private readonly trPtr: TrExp,
		private readonly trOffset: TrExp
	) {
		super(type, new CAccess(TrOffsetPtr.from(trPtr, trOffset)));
	}
	offsetPtr(n: number | ExprAll) {
		return new ExprImpl(
			this.ptrCon(this.type),
			TrOffsetPtr.from(TrOffsetPtr.from(this.trPtr, this.trOffset), castLiteral(Int, n).tr)
		);
	}
	get ptr() {
		return this.offsetPtr(0);
	}
	setPart(n: number | ExprAll, v: boolean | number | ExprAll) {
		return new Stmt(
			new TrSetVariable(new this.CAccess(this.offsetPtr(n).tr), castLiteral(this.type, v).tr)
		);
	}
	set(v: number | boolean | ExprAll) {
		return this.setPart(0, v);
	}
}

export class LocalVarExprImpl extends CoercedVarImpl {
	protected constructor(type: TT, symbol: symbol) {
		super(type, Store, TrStorage, new TrLocalPtr(symbol, 0), new TrConst(0));
	}

	static fromSymbol<T extends TT>(ty: T, s: symbol): Expr<T> & ExprVarStore<T> {
		return (new LocalVarExprImpl(ty, s) as unknown) as Expr<T> & ExprVarStore<T>;
	}
}

export class CvtExprImpl<T extends TT> extends CoercedVarImpl {
	protected constructor(type: T, symbol: symbol) {
		super(type, Cvt, TrCvt, new TrCvtPtr(symbol, 0), new TrConst(0));
	}
}

// Casting
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
