import Assembler from "../ir";
import { TtSymbol } from "../scope";

export abstract class Statement {
	public abstract refer(asm: Assembler): void;
	public abstract compile(asm: Assembler): void;
	public willReturnAfter(): boolean {
		return false;
	}
}

export abstract class Expression extends Statement {
	public abstract readonly arity: number;
	// Return the number if the value is a constant, undefined otherwise
	public constant(): number | undefined {
		return undefined;
	}
}

export abstract class Variable extends Expression implements TtSymbol {
	constructor() {
		super();
		this.index = this.ptr = new PointerExpressionImpl(this);
	}

	// TtSymbol properties
	public variableIndex: number | undefined = undefined;
	public readonly allowByte = true;
	public size = 1;
	public resolve() {
		return this.variableIndex || 0;
	}

	// Expression properties
	public readonly arity = 1;
	public abstract readonly accessor: Accessor; // Read-write pair

	public refer(asm: Assembler) {
		asm.refValue(this);
	}

	public abstract compilePtr(asm: Assembler): void;
	public constantPtr(): number | undefined {
		return undefined;
	}

	public compile(asm: Assembler) {
		this.compilePtr(asm);
		this.accessor.compileRead(asm);
	}

	// "Pointer" expression
	public readonly index: PointerExpression;
	public readonly ptr: PointerExpression;
}

export interface PointerExpression extends Expression {
	readonly dereference: Variable;
}

class PointerExpressionImpl extends Expression {
	constructor(readonly dereference: Variable) {
		super();
	}
	public readonly arity = 1;
	public compile(asm: Assembler) {
		return this.dereference.compilePtr(asm);
	}
	public refer(asm: Assembler) {
		this.dereference.refer(asm);
	}
}

export interface Accessor {
	compileRead(asm: Assembler): void;
	compileSet(asm: Assembler): void;
}

export const ReadOnly = {
	compileSet(asm: Assembler) {
		throw new TypeError("Variable is readonly");
	}
};
