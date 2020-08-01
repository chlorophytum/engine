import { TTI } from "../../instr";
import Assembler from "../../ir";
import { Accessor, Expression, PointerExpression, Statement, Variable } from "../interface";

import { cExpr, cExpr1 } from "./constant";

export class CoercedVariable extends Variable {
	constructor(
		readonly behind: Expression,
		readonly accessor: Accessor,
		readonly size: number = 1
	) {
		super();
	}
	public refer(asm: Assembler) {
		this.behind.refer(asm);
	}
	public constantPtr() {
		return this.behind.constant();
	}
	public compilePtr(asm: Assembler) {
		this.behind.compile(asm);
	}
}

export class ArrayIndex extends Variable {
	private readonly subscript: Expression;
	public readonly accessor: Accessor;
	constructor(readonly arr: Variable, _subscript: number | Expression) {
		super();
		this.subscript = cExpr1(_subscript);
		this.accessor = arr.accessor;
	}
	public compilePtr(asm: Assembler) {
		const cSub = this.subscript.constant();
		const cPtr = this.arr.constantPtr();
		if (cPtr !== undefined && cSub !== undefined) {
			asm.intro(cPtr + cSub);
		} else if (cSub !== undefined) {
			this.subscript.compile(asm);
			this.arr.compilePtr(asm);
			asm.prim(TTI.ADD)
				.deleted(2)
				.added(1);
		} else {
			this.arr.compilePtr(asm);
			this.subscript.compile(asm);
			asm.prim(TTI.ADD)
				.deleted(2)
				.added(1);
		}
	}
}
export class TupleExpression extends Expression {
	private readonly parts: Expression[];
	public readonly arity: number;
	constructor(_parts: Iterable<number | Expression>) {
		super();
		this.parts = [..._parts].map(cExpr);
		let arity = 0;
		for (const part of this.parts) arity += part.arity;
		this.arity = arity;
	}
	public compile(asm: Assembler) {
		for (const part of this.parts) part.compile(asm);
	}
	public refer(asm: Assembler) {
		for (const part of this.parts) part.refer(asm);
	}
}
export class ArrayInit extends Statement {
	private readonly parts: Expression[];
	constructor(
		readonly arr: PointerExpression,
		_parts: Iterable<number | Expression>,
		private complex?: boolean
	) {
		super();
		this.parts = [..._parts].map(cExpr);
	}
	private compileVerySimple(cPtr: number, asm: Assembler) {
		for (let j = 0; j < this.parts.length; j++) {
			const cur = this.parts[j];
			if (cur.arity !== 1) throw new TypeError("Array initializer arity mismatch");
			asm.intro(cPtr + j);
			cur.compile(asm);
			this.arr.dereference.accessor.compileSet(asm);
		}
	}
	private compileComplex(asm: Assembler) {
		this.arr.dereference.compilePtr(asm);
		let items = 0;
		for (let j = 0; j < this.parts.length; j++) {
			const arity = this.parts[j].arity;
			this.parts[j].compile(asm);
			items += arity;
		}
		if (items !== this.arr.dereference.size) {
			throw new TypeError("Array initializer arity mismatch");
		}

		// Stack: pArray a b c ... x
		for (let k = 0; k < items; k++) {
			asm.needAccurateStackHeight();
			asm.push(items - k - 1, items + 2 - k);
			asm.prim(TTI.CINDEX)
				.deleted(1)
				.added(1);
			// pArray a b c ... x pArray
			asm.prim(TTI.ADD)
				.deleted(2)
				.added(1);
			// pArray a[0] a[1] ... a[A - 1 - k] (pArray + (j + A - 1 - k))
			asm.prim(TTI.SWAP)
				.deleted(2)
				.added(2);
			this.arr.dereference.accessor.compileSet(asm);
		}
		asm.prim(TTI.POP).deleted(1);
	}
	public compile(asm: Assembler) {
		if (!this.complex && this.parts.length === this.arr.dereference.size) {
			const cPtr = this.arr.dereference.constantPtr();
			if (cPtr !== undefined) {
				this.compileVerySimple(cPtr, asm);
			} else {
				this.compileComplex(asm);
			}
		} else {
			this.compileComplex(asm);
		}
	}
	public refer(asm: Assembler) {
		this.arr.refer(asm);
		for (const part of this.parts) part.refer(asm);
	}
}
export class ArrayInitGetVariation extends Statement {
	constructor(readonly arr: PointerExpression, private readonly arity: number) {
		super();
	}
	public refer(asm: Assembler) {}
	public compile(asm: Assembler) {
		this.arr.dereference.compilePtr(asm);
		asm.prim(TTI.GETVARIATION).added(this.arity);

		if (this.arity !== this.arr.dereference.size) {
			throw new TypeError("Array initializer arity mismatch");
		}

		// Stack: pArray a b c ... x
		for (let k = 0; k < this.arity; k++) {
			asm.needAccurateStackHeight();
			asm.push(this.arity - k - 1, this.arity + 2 - k);
			asm.prim(TTI.CINDEX)
				.deleted(1)
				.added(1);
			// pArray a b c ... x pArray
			asm.prim(TTI.ADD)
				.deleted(2)
				.added(1);
			// pArray a[0] a[1] ... a[A - 1 - k] (pArray + (j + A - 1 - k))
			asm.prim(TTI.SWAP)
				.deleted(2)
				.added(2);
			this.arr.dereference.accessor.compileSet(asm);
		}
		asm.prim(TTI.POP).deleted(1);
	}
}
