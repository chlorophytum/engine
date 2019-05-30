import Assembler from "../ir";
import { TtSymbol } from "../scope";

export abstract class Statement {
	abstract refer(asm: Assembler): void;
	abstract compile(asm: Assembler): void;
	willReturnAfter(): boolean {
		return false;
	}
}

export abstract class Expression extends Statement {
	abstract readonly arity: number;
	// Return the number if the value is a constant, undefined otherwise
	constant(): number | undefined {
		return undefined;
	}
}

export abstract class Variable extends Expression implements TtSymbol {
	constructor() {
		super();
		this.index = this.ptr = new PointerExpressionImpl(this);
	}

	// TtSymbol properties
	variableIndex: number | undefined = undefined;
	readonly allowByte = true;
	size = 1;
	resolve() {
		return this.variableIndex || 0;
	}

	// Expression properties
	readonly arity = 1;
	abstract readonly accessor: Accessor; // Read-write pair

	refer(asm: Assembler) {
		asm.refValue(this);
	}

	abstract compilePtr(asm: Assembler): void;
	constantPtr(): number | undefined {
		return undefined;
	}

	compile(asm: Assembler) {
		this.compilePtr(asm);
		this.accessor.compileRead(asm);
	}

	// "Pointer" expression
	readonly index: PointerExpression;
	readonly ptr: PointerExpression;
}

export interface PointerExpression extends Expression {
	readonly dereference: Variable;
}

class PointerExpressionImpl extends Expression {
	constructor(readonly dereference: Variable) {
		super();
	}
	readonly arity = 1;
	compile(asm: Assembler) {
		return this.dereference.compilePtr(asm);
	}
	refer(asm: Assembler) {
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
