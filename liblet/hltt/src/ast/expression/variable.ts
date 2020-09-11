import Assembler from "../../asm";
import { TTI } from "../../instr";
import { StdLib } from "../../stdlib/init-stdlib";
import { VarKind, Expression, Statement, Variable } from "../interface";
import { TtProgramScope, TtScopeVariableFactory, TtProgramScopeTy } from "../scope";
import { VkCvt, VkFpgm, VkArgument, VkTwilight, VkStorage } from "../variable-kinds";
import { cExpr } from "./constant";

export const ReadOnly = {
	compileSet(asm: Assembler) {
		throw new TypeError("Variable is readonly");
	}
};

export class StaticStorage extends Variable<VkStorage> {
	constructor(readonly size: number) {
		super();
		if (size <= 0) throw new RangeError("Array must have size > 0");
	}
	public isConstantPtr() {
		return this.variableIndex;
	}
	public compilePtr(asm: Assembler) {
		asm.intro(this);
	}
	public readonly accessor = new VkStorage();
}

export class LocalVariable extends Variable<VkStorage> {
	constructor(private scope: TtProgramScope, readonly size: number) {
		super();
		if (size <= 0) throw new RangeError("Array must have size > 0");
	}
	public readonly accessor = new VkStorage();
	public compilePtr(asm: Assembler) {
		const idx = (this.variableIndex || 0) + this.size - 1;
		if (idx) {
			asm.intro(idx);
			StdLib.getLocalVariable.inline(this.scope.globals, asm);
		} else {
			asm.intro(this.scope.globals.sp).prim(TTI.RS).deleted(1).added(1);
		}
	}
}

export class LocalArgument extends Variable<VkArgument> {
	public compilePtr(asm: Assembler) {
		throw new Error("Cannot reference pointer of local argument");
	}
	public readonly accessor = new VkArgument();
	public compile(asm: Assembler) {
		asm.nthFromBottom(this.variableIndex || 0);
	}
}

export class FunctionVariable extends Variable<VkFpgm> {
	public isConstantPtr() {
		return this.variableIndex;
	}
	public compilePtr(asm: Assembler) {
		asm.intro(this);
	}
	public readonly accessor = new VkFpgm();
}

export class TwilightVariable extends Variable<VkTwilight> {
	public readonly accessor = new VkTwilight();
	public compilePtr(asm: Assembler) {
		throw new Error("Cannot reference pointer of twilight point index");
	}
	public compile(asm: Assembler) {
		asm.intro(~this.resolve());
	}
	public isConstant() {
		return this.variableIndex !== undefined ? ~this.variableIndex : undefined;
	}
}

export class ControlValue extends Variable<VkCvt> {
	constructor(readonly size: number) {
		super();
		if (size <= 0) throw new RangeError("Array must have size > 0");
	}
	public isConstantPtr() {
		return this.variableIndex;
	}
	public compilePtr(asm: Assembler) {
		asm.intro(this);
	}
	public readonly accessor = new VkCvt();
}

export class VariableSet<A extends VarKind> extends Statement {
	private readonly b: Expression;
	constructor(private readonly v: Variable<A>, _b: number | Expression) {
		super();
		this.b = cExpr(_b);
	}
	public compile(asm: Assembler) {
		if (this.b.arity !== 1) throw new TypeError("RHS arity > 1");
		this.v.compilePtr(asm);
		this.b.compile(asm);
		this.v.accessor.compileSet(asm);
	}
}

export const VariableFactory: TtScopeVariableFactory = {
	storage: (size: number) => new StaticStorage(size),
	fpgm: () => new FunctionVariable(),
	cvt: (size: number) => new ControlValue(size),
	twilight: () => new TwilightVariable(),
	local: (s: TtProgramScopeTy) => ({
		local: (size: number) =>
			s.isFunction ? new LocalVariable(s, size) : new StaticStorage(size),
		argument: () => new LocalArgument(),
		localTwilight: () => new TwilightVariable()
	})
};
