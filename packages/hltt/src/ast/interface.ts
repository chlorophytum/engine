import Assembler from "../asm";
import { TTI } from "../instr";
import {
	TtFunctionScopeSolverT,
	TtGlobalScopeT,
	TtLocalScopeVariableFactoryT,
	TtProgramScopeT,
	TtScopeVariableFactoryT,
	TtBinding
} from "../scope";

export abstract class Statement {
	public abstract compile(asm: Assembler, ps: EdslProgramScope): void;
	public willReturnAfter(): boolean {
		return false;
	}
}

export abstract class Expression extends Statement {
	public abstract getArity(ps: EdslProgramScope): number;
	// Return the number if the value is a constant, undefined otherwise
	public isConstant(): number | undefined {
		return undefined;
	}
}

export interface VarKind {
	compileRead(asm: Assembler): void;
	compileSet(asm: Assembler): void;
}

export class VkStorage implements VarKind {
	private readonly m_accessorTypeVariable = true;
	compileRead(asm: Assembler) {
		asm.prim(TTI.RS).deleted(1).added(1);
	}
	compileSet(asm: Assembler) {
		asm.prim(TTI.WS).deleted(2);
	}
}

export class VkArgument {
	private readonly m_accessorTypeArgument = true;
	compileRead(asm: Assembler) {
		throw new Error("Cannot reference pointer of local argument");
	}
	compileSet(asm: Assembler) {
		throw new TypeError("Variable is readonly");
	}
}

export class VkFpgm implements VarKind {
	private readonly m_accessorTypeFunction = true;
	compileRead(asm: Assembler) {
		throw new Error("Cannot reference value of FDEF");
	}
	compileSet(asm: Assembler) {
		throw new TypeError("Variable is readonly");
	}
}

export class VkTwilight implements VarKind {
	private readonly m_accessorTypeTwilight = true;
	compileRead(asm: Assembler) {
		throw new Error("Cannot reference pointer of twilight point index");
	}
	compileSet(asm: Assembler) {
		throw new TypeError("Variable is readonly");
	}
}

export class VkCvt {
	private readonly m_accessorTypeControlValue = true;

	compileRead(asm: Assembler) {
		asm.prim(TTI.RCVT).deleted(1).added(1);
	}
	compileSet(asm: Assembler) {
		asm.prim(TTI.WCVTP).deleted(2);
	}
}

export abstract class Variable<Vk extends VarKind> extends Expression implements TtBinding {
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
	public getArity() {
		return 1;
	}
	public abstract readonly accessor: Vk;

	public abstract compilePtr(asm: Assembler, ps: EdslProgramScope): void;
	public isConstantPtr(): number | undefined {
		return undefined;
	}

	public compile(asm: Assembler, ps: EdslProgramScope) {
		asm.refValue(this);
		this.compilePtr(asm, ps);
		this.accessor.compileRead(asm);
	}

	// "Pointer" expression
	public readonly index: PtrExpression<Vk>;
	public readonly ptr: PtrExpression<Vk>;
}

export interface PtrExpression<Vk extends VarKind> extends Expression {
	readonly dereference: Variable<Vk>;
}

class PointerExpressionImpl<Vk extends VarKind> extends Expression {
	constructor(readonly dereference: Variable<Vk>) {
		super();
	}
	public getArity() {
		return 1;
	}
	public compile(asm: Assembler, ps: EdslProgramScope) {
		return this.dereference.compilePtr(asm, ps);
	}
}

// EDSL type aliases

export type EdslScopeVariableFactory = TtScopeVariableFactoryT<
	Variable<VkStorage>,
	Variable<VkArgument>,
	Variable<VkFpgm>,
	Variable<VkCvt>,
	Variable<VkTwilight>
>;

export type EdslFunctionScopeSolver = TtFunctionScopeSolverT<
	Variable<VkStorage>,
	Variable<VkArgument>,
	Variable<VkFpgm>,
	Variable<VkCvt>,
	Variable<VkTwilight>
>;

export class EdslGlobalScope extends TtGlobalScopeT<
	Variable<VkStorage>,
	Variable<VkArgument>,
	Variable<VkFpgm>,
	Variable<VkCvt>,
	Variable<VkTwilight>
> {}

export type EdslLocalScopeVariableFactory = TtLocalScopeVariableFactoryT<
	Variable<VkStorage>,
	Variable<VkArgument>,
	Variable<VkFpgm>,
	Variable<VkCvt>,
	Variable<VkTwilight>
>;

export class EdslProgramScope extends TtProgramScopeT<
	Variable<VkStorage>,
	Variable<VkArgument>,
	Variable<VkFpgm>,
	Variable<VkCvt>,
	Variable<VkTwilight>
> {}

export type EdslProgramScopeTy = TtProgramScopeT<
	Variable<VkStorage>,
	Variable<VkArgument>,
	Variable<VkFpgm>,
	Variable<VkCvt>,
	Variable<VkTwilight>
>;
