import { TT } from "@chlorophytum/hltt-next-type-system";

import { Expr } from "../expr";
import { ExprImpl } from "../expr-impl/expr";

export class VarArgs {
	private constructor(private readonly m_args: Expr<TT>[]) {}
	private m_taken = 0;

	static from(args: Expr<TT>[]) {
		return new VarArgs(args);
	}
	take<T extends TT>(ty: T, n: number): Expr<T>[] {
		const a: Expr<T>[] = [];
		for (let i = 0; i < n; i++) {
			const e = this.m_args[this.m_taken++];
			if (e.type.id === ty.id) a.push(ExprImpl.create(ty, e.tr));
			else
				throw new TypeError(
					`Type mismatch between ${e.type.id} and ${ty.id} (#${this.m_taken})`
				);
		}
		return a;
	}
}
