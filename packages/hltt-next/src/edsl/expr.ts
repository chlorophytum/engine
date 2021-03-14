import { TrExp } from "../tr/tr";

import { Bool, Cvt, Int, Store, TArith, THandle, TT } from "./type-system";

///////////////////////////////////////////////////////////////////////////////////////////////////
// eDSL Expression, with conditional types

export type Expr<T> = ExprBase<T> &
	(T extends Store<infer TElement> | Cvt<infer TElement> ? ExprDeRef<TElement> : ExprNotDeRef);

export interface ExprBase<T> {
	readonly type: T;
	readonly tr: TrExp;
}

export interface ExprNotArith<T> {}

export interface ExprDeRef<T> {
	readonly deRef: Expr<T>;
	part(n: number | Expr<Int>): Expr<T>;
}
export interface ExprNotDeRef {}

export interface ExprVarStore<T extends TT> extends ExprBase<T> {
	readonly ptr: Expr<Store<T>>;
	offsetPtr(n: number | Expr<Int>): Expr<Store<T>>;
}

export interface ExprVarCvt<T extends TT> extends ExprBase<T> {
	readonly ptr: Expr<Cvt<T>>;
	offsetPtr(n: number | Expr<Int>): Expr<Store<T>>;
}

export type CompatibleType<T> = T extends TArith
	? number
	: T extends THandle
	? number
	: T extends Bool
	? boolean
	: never;

///////////////////////////////////////////////////////////////////////////////////////////////////
// "All interface" version, used for implementing constructors

export type ExprAll<T> = ExprBase<T> & ExprDeRefAll<TT>;

export interface ExprDeRefAll<T> {
	readonly deRef: ExprAll<T>;
	part(n: number | ExprAll<Int>): ExprAll<T>;
}

export interface ExprVarStoreAll<T extends TT> extends ExprAll<T> {
	readonly ptr: ExprAll<Store<T>>;
	offsetPtr(n: number | ExprAll<Int>): ExprAll<Store<T>>;
}

export interface ExprVarCvtAll<T extends TT> extends ExprAll<T> {
	readonly ptr: ExprAll<Cvt<T>>;
	offsetPtr(n: number | ExprAll<Int>): ExprAll<Cvt<T>>;
}
