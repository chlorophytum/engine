import { Decl } from "../../tr/decl";
import { GlobalScope } from "../../tr/scope";
import { CvtExprImpl } from "../expr-impl/expr";
import { TArith } from "../type-system";

export function ControlValue<T extends TArith>(type: T, size: number = 1) {
	return CvtExprImpl.fromDecl(type, new CvDeclaration<T>(type, size));
}

class CvDeclaration<T extends TArith> implements Decl {
	constructor(public readonly type: T, private readonly size: number) {}
	private readonly m_symbol = Symbol();

	populateInterface(gs: GlobalScope) {
		if (!gs.cvt.haveDeclared(this.m_symbol)) gs.cvt.declare(this.size, this.m_symbol);
		return this.m_symbol;
	}
}
