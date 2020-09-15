import { TTI } from "../../instr";
import Assembler from "../../asm";
import {
	VarKind,
	Expression,
	PtrExpression,
	Statement,
	Variable,
	EdslProgramScope
} from "../interface";

import { cExpr } from "./constant";

export class CoercedVariable<A extends VarKind> extends Variable<A> {
	constructor(readonly behind: Expression, readonly accessor: A, readonly size: number = 1) {
		super();
	}
	public isConstantPtr() {
		return this.behind.isConstant();
	}
	public compilePtr(asm: Assembler, ps: EdslProgramScope) {
		this.behind.compile(asm, ps);
	}
}

export class ArrayIndex<A extends VarKind> extends Variable<A> {
	private readonly subscript: Expression;
	public readonly accessor: A;
	constructor(readonly arr: Variable<A>, _subscript: number | Expression) {
		super();
		this.subscript = cExpr(_subscript);
		this.accessor = arr.accessor;
	}
	public compilePtr(asm: Assembler, ps: EdslProgramScope) {
		if (this.subscript.getArity(ps) !== 1) throw new TypeError("Subscript arity != 1");

		const cSub = this.subscript.isConstant();
		const cPtr = this.arr.isConstantPtr();
		if (cPtr !== undefined && cSub !== undefined) {
			asm.intro(cPtr + cSub);
		} else if (cSub !== undefined) {
			this.subscript.compile(asm, ps);
			this.arr.compilePtr(asm, ps);
			asm.prim(TTI.ADD).deleted(2).added(1);
		} else {
			this.arr.compilePtr(asm, ps);
			this.subscript.compile(asm, ps);
			asm.prim(TTI.ADD).deleted(2).added(1);
		}
	}
}
export class TupleExpression extends Expression {
	private readonly parts: Expression[];
	constructor(_parts: Iterable<number | Expression>) {
		super();
		this.parts = [..._parts].map(cExpr);
	}
	getArity(ps: EdslProgramScope) {
		let arity = 0;
		for (let part of this.parts) arity += part.getArity(ps);
		return arity;
	}
	public compile(asm: Assembler, ps: EdslProgramScope) {
		for (const part of this.parts) part.compile(asm, ps);
	}
}
export class ArrayInit<A extends VarKind> extends Statement {
	private readonly parts: Expression[];
	constructor(
		readonly arr: PtrExpression<A>,
		_parts: Iterable<number | Expression>,
		private complex?: boolean
	) {
		super();
		this.parts = [..._parts].map(cExpr);
	}
	private compileVerySimple(cPtr: number, asm: Assembler, ps: EdslProgramScope) {
		for (let j = 0; j < this.parts.length; j++) {
			const cur = this.parts[j];
			if (cur.getArity(ps) !== 1) throw new TypeError("Array initializer arity mismatch");
			asm.intro(cPtr + j);
			cur.compile(asm, ps);
			this.arr.dereference.accessor.compileSet(asm);
		}
	}
	private compileComplex(asm: Assembler, ps: EdslProgramScope) {
		this.arr.dereference.compilePtr(asm, ps);
		let items = 0;
		for (let j = 0; j < this.parts.length; j++) {
			const arity = this.parts[j].getArity(ps);
			this.parts[j].compile(asm, ps);
			items += arity;
		}
		if (items !== this.arr.dereference.size) {
			throw new TypeError("Array initializer arity mismatch");
		}

		// Stack: pArray a b c ... x
		for (let k = 0; k < items; k++) {
			asm.needAccurateStackHeight();
			asm.push(items - k - 1, items + 2 - k);
			asm.prim(TTI.CINDEX).deleted(1).added(1);
			// pArray a b c ... x pArray
			asm.prim(TTI.ADD).deleted(2).added(1);
			// pArray a[0] a[1] ... a[A - 1 - k] (pArray + (j + A - 1 - k))
			asm.prim(TTI.SWAP).deleted(2).added(2);
			this.arr.dereference.accessor.compileSet(asm);
		}
		asm.prim(TTI.POP).deleted(1);
	}
	public compile(asm: Assembler, ps: EdslProgramScope) {
		if (!this.complex && this.parts.length === this.arr.dereference.size) {
			const cPtr = this.arr.dereference.isConstantPtr();
			if (cPtr !== undefined) {
				this.compileVerySimple(cPtr, asm, ps);
			} else {
				this.compileComplex(asm, ps);
			}
		} else {
			this.compileComplex(asm, ps);
		}
	}
}
export class ArrayInitGetVariation<A extends VarKind> extends Statement {
	constructor(readonly arr: PtrExpression<A>, private readonly arity: number) {
		super();
	}
	public compile(asm: Assembler, ps: EdslProgramScope) {
		this.arr.dereference.compilePtr(asm, ps);
		asm.prim(TTI.GETVARIATION).added(this.arity);

		if (this.arity !== this.arr.dereference.size) {
			throw new TypeError("Array initializer arity mismatch");
		}

		// Stack: pArray a b c ... x
		for (let k = 0; k < this.arity; k++) {
			asm.needAccurateStackHeight();
			asm.push(this.arity - k - 1, this.arity + 2 - k);
			asm.prim(TTI.CINDEX).deleted(1).added(1);
			// pArray a b c ... x pArray
			asm.prim(TTI.ADD).deleted(2).added(1);
			// pArray a[0] a[1] ... a[A - 1 - k] (pArray + (j + A - 1 - k))
			asm.prim(TTI.SWAP).deleted(2).added(2);
			this.arr.dereference.accessor.compileSet(asm);
		}
		asm.prim(TTI.POP).deleted(1);
	}
}
