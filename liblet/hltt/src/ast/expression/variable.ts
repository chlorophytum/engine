import { TTI } from "../../instr";
import Assembler from "../../ir";
import { ProgramScope, TtScopeVariableFactory } from "../../scope";
import { StdLib } from "../../stdlib/init-stdlib";
import { Expression, ReadOnly, Statement, Variable } from "../interface";

import { cExpr } from "./constant";

export class StaticStorage extends Variable {
	constructor(readonly size: number) {
		super();
		if (size <= 0) throw new RangeError("Array must have size > 0");
	}
	public constantPtr() {
		return this.variableIndex;
	}
	public compilePtr(asm: Assembler) {
		asm.intro(this);
	}
	public readonly accessor = VariableAccessor;
}

export class LocalVariable extends Variable {
	constructor(private scope: ProgramScope<Variable>, readonly size: number) {
		super();
		if (size <= 0) throw new RangeError("Array must have size > 0");
	}
	public readonly accessor = VariableAccessor;
	public compilePtr(asm: Assembler) {
		const idx = (this.variableIndex || 0) + this.size - 1;
		if (idx) {
			asm.intro(idx);
			StdLib.getLocalVariable.inline(this.scope.globals, asm);
		} else {
			asm.intro(this.scope.globals.sp)
				.prim(TTI.RS)
				.deleted(1)
				.added(1);
		}
	}
}

export const VariableAccessor = {
	compileRead(asm: Assembler) {
		asm.prim(TTI.RS)
			.deleted(1)
			.added(1);
	},
	compileSet(asm: Assembler) {
		asm.prim(TTI.WS).deleted(2);
	}
};

export class LocalArgument extends Variable {
	public compilePtr(asm: Assembler) {
		throw new Error("Cannot reference pointer of local argument");
	}
	public readonly accessor = LocalArgumentAccessor;
	public compile(asm: Assembler) {
		asm.nthFromBottom(this.variableIndex || 0);
	}
}

export const LocalArgumentAccessor = {
	...ReadOnly,
	compileRead(asm: Assembler) {
		throw new Error("Cannot reference pointer of local argument");
	}
};

export class FunctionVariable extends Variable {
	public constantPtr() {
		return this.variableIndex;
	}
	public compilePtr(asm: Assembler) {
		asm.intro(this);
	}
	public readonly accessor = FunctionVariableAccessor;
}

export const FunctionVariableAccessor = {
	...ReadOnly,
	compileRead(asm: Assembler) {
		throw new Error("Cannot reference value of FDEF");
	}
};

export class TwilightVariable extends Variable {
	public readonly accessor = TwilightVariableAccessor;
	public compilePtr(asm: Assembler) {
		throw new Error("Cannot reference pointer of twilight point index");
	}
	public compile(asm: Assembler) {
		asm.intro(~this.resolve());
	}
	public constant() {
		return this.variableIndex !== undefined ? ~this.variableIndex : undefined;
	}
}

export const TwilightVariableAccessor = {
	...ReadOnly,
	compileRead(asm: Assembler) {
		throw new Error("Cannot reference pointer of twilight point index");
	}
};

export class ControlValue extends Variable {
	constructor(readonly size: number) {
		super();
		if (size <= 0) throw new RangeError("Array must have size > 0");
	}
	public constantPtr() {
		return this.variableIndex;
	}
	public compilePtr(asm: Assembler) {
		asm.intro(this);
	}
	public readonly accessor = ControlValueAccessor;
}

export const ControlValueAccessor = {
	compileRead(asm: Assembler) {
		asm.prim(TTI.RCVT)
			.deleted(1)
			.added(1);
	},
	compileSet(asm: Assembler) {
		asm.prim(TTI.WCVTP).deleted(2);
	}
};

export class VariableSet extends Statement {
	private readonly b: Expression;
	constructor(private readonly v: Variable, _b: number | Expression) {
		super();
		this.b = cExpr(_b);
	}
	public refer(asm: Assembler) {
		this.v.refer(asm);
		this.b.refer(asm);
	}
	public compile(asm: Assembler) {
		if (this.b.arity !== 1) throw new TypeError("RHS arity > 1");
		this.v.compilePtr(asm);
		this.b.compile(asm);
		this.v.accessor.compileSet(asm);
	}
}

export const VariableFactory: TtScopeVariableFactory<Variable> = {
	storage: size => new StaticStorage(size),
	fpgm: () => new FunctionVariable(),
	cvt: size => new ControlValue(size),
	twilight: () => new TwilightVariable(),
	local: s => ({
		local: size => (s.isFunction ? new LocalVariable(s, size) : new StaticStorage(size)),
		argument: () => new LocalArgument(),
		localTwilight: () => new TwilightVariable()
	})
};
