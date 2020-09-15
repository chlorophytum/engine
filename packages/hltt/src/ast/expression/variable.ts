import Assembler from "../../asm";
import { TTI } from "../../instr";
import { TtSymbolSupportT } from "../../scope";
import { StdLib } from "../../stdlib/init-stdlib";
import {
	EdslProgramScope,
	EdslProgramScopeTy,
	EdslScopeVariableFactory,
	Expression,
	Statement,
	Variable,
	VarKind,
	VkArgument,
	VkCvt,
	VkFpgm,
	VkStorage,
	VkTwilight
} from "../interface";
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
	constructor(private scope: EdslProgramScope, readonly size: number) {
		super();
		if (size <= 0) throw new RangeError("Array must have size > 0");
	}
	public readonly accessor = new VkStorage();
	public compilePtr(asm: Assembler) {
		const idx = (this.variableIndex || 0) + this.size - 1;
		if (idx) {
			asm.intro(idx);
			StdLib.getLocalVariable.inline(this.scope, asm);
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
	public compile(asm: Assembler, ps: EdslProgramScope) {
		if (this.b.getArity(ps) !== 1) throw new TypeError("RHS arity > 1");
		this.v.compilePtr(asm, ps);
		this.b.compile(asm, ps);
		this.v.accessor.compileSet(asm);
	}
}

export class CVariableSupport<A extends VarKind> implements TtSymbolSupportT<Variable<A>> {
	constructor(private readonly mk: (size: number, name?: string) => Variable<A>) {}
	create(size: number, name?: string) {
		return this.mk(size, name);
	}
	assignID(s: Variable<A>, id: number) {
		s.variableIndex = id;
	}
}

export const VariableFactory: EdslScopeVariableFactory = {
	storage: new CVariableSupport((size: number) => new StaticStorage(size)),
	fpgm: new CVariableSupport(() => new FunctionVariable()),
	cvt: new CVariableSupport((size: number) => new ControlValue(size)),
	twilight: new CVariableSupport(() => new TwilightVariable()),
	local: (s: EdslProgramScopeTy) => ({
		local: s.isFunction
			? new CVariableSupport((size: number) => new LocalVariable(s, size))
			: new CVariableSupport((size: number) => new StaticStorage(size)),
		argument: new CVariableSupport(() => new LocalArgument()),
		localTwilight: new CVariableSupport(() => new TwilightVariable())
	})
};
