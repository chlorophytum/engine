import { TrCvt, TrStorage, TrArrayInit, TrArrayInitGetVariation } from "@chlorophytum/hltt-next-tr";

import { CompatibleType, Expr } from "../expr";
import { castLiteral } from "../expr-impl/expr";
import { Stmt } from "../stmt";
import { Cvt, Store, TT, UniFrac } from "../type-system";

export function arrayInit<T extends TT>(
	pArr: Expr<Store<T> | Cvt<T>>,
	...items: CompatibleType<T>[]
) {
	const trArr = pArr.type.kind === "Store" ? new TrStorage(pArr.tr) : new TrCvt(pArr.tr);
	return new Stmt(
		new TrArrayInit(
			trArr,
			items.map(x => castLiteral(pArr.type.member, x).tr)
		)
	);
}

export function getVariation(pArr: Expr<Store<UniFrac> | Cvt<UniFrac>>) {
	const trArr = pArr.type.kind === "Store" ? new TrStorage(pArr.tr) : new TrCvt(pArr.tr);
	return new Stmt(new TrArrayInitGetVariation(trArr));
}
