import { Decl, TrExp } from "@chlorophytum/hltt-next-tr";
import { Bool, Cvt, Int, Store, TArith, THandle, TT } from "@chlorophytum/hltt-next-type-system";

import { Stmt } from "./stmt";

///////////////////////////////////////////////////////////////////////////////////////////////////
// eDSL Expression, with conditional types

export type Expr<T> = ExprBase<T> &
	(T extends Store<infer TElement> ? ExprDeRefStore<TElement> : ExprNotDeRef) &
	(T extends Cvt<infer TElement> ? ExprDeRefCvt<TElement> : ExprNotDeRef);

export interface ExprBase<T> {
	readonly type: T;
	readonly tr: TrExp;
}

export interface ExprNotArith<T> {}

export interface ExprDeRefStore<T extends TT> {
	readonly deRef: Expr<T> & ExprVarStore<T>;
	part(n: number | Expr<Int>): Expr<T> & ExprVarStore<T>;
}
export interface ExprDeRefCvt<T extends TT> {
	readonly deRef: Expr<T> & ExprVarCvt<T>;
	part(n: number | Expr<Int>): Expr<T> & ExprVarCvt<T>;
}
export interface ExprNotDeRef {}

export interface ExprVarStore<T extends TT> extends ExprBase<T> {
	readonly ptr: Expr<Store<T>>;
	offsetPtr(n: number | Expr<Int>): Expr<Store<T>>;
	setPart(n: number | Expr<Int>, value: CompatibleType<T>): Stmt;
	set(value: CompatibleType<T> | Expr<T>): Stmt;
}

export interface ExprVarCvt<T extends TT> extends ExprBase<T> {
	readonly ptr: Expr<Cvt<T>>;
	readonly decl: undefined | null | Decl;
	offsetPtr(n: number | Expr<Int>): Expr<Cvt<T>>;
	setPart(n: number | Expr<Int>, value: CompatibleType<T>): Stmt;
	set(value: CompatibleType<T> | Expr<T>): Stmt;
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

export type ExprAll = ExprBase<TT> & ExprDeRefAll;

export interface ExprDeRefAll {
	readonly deRef: ExprVarAll;
	part(n: number | ExprAll): ExprVarAll;
}

export interface ExprVarAll extends ExprAll {
	readonly ptr: ExprAll;
	offsetPtr(n: number | ExprAll): ExprAll;
	setPart(n: number | ExprAll, v: number | boolean | ExprAll): Stmt;
	set(v: number | boolean | ExprAll): Stmt;
}
