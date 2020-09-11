import Assembler from "../asm";
import { TtSymbol } from "../scope";

export abstract class Statement {
	public abstract compile(asm: Assembler): void;
	public willReturnAfter(): boolean {
		return false;
	}
}

export abstract class Expression extends Statement {
	public abstract readonly arity: number;
	// Return the number if the value is a constant, undefined otherwise
	public isConstant(): number | undefined {
		return undefined;
	}
}

export interface VarKind {
	compileRead(asm: Assembler): void;
	compileSet(asm: Assembler): void;
}

export abstract class Variable<Vk extends VarKind> extends Expression implements TtSymbol {
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
	public abstract readonly accessor: Vk;

	public abstract compilePtr(asm: Assembler): void;
	public isConstantPtr(): number | undefined {
		return undefined;
	}

	public compile(asm: Assembler) {
		asm.refValue(this);
		this.compilePtr(asm);
		this.accessor.compileRead(asm);
	}

	// "Pointer" expression
	public readonly index: PointerExpression<Vk>;
	public readonly ptr: PointerExpression<Vk>;
}

export interface PointerExpression<Vk extends VarKind> extends Expression {
	readonly dereference: Variable<Vk>;
}

class PointerExpressionImpl<Vk extends VarKind> extends Expression {
	constructor(readonly dereference: Variable<Vk>) {
		super();
	}
	public readonly arity = 1;
	public compile(asm: Assembler) {
		return this.dereference.compilePtr(asm);
	}
}
