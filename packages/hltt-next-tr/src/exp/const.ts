import { Assembler } from "@chlorophytum/hltt-next-backend";

import { ProgramScope } from "../scope";
import { TrExp } from "../tr";

export class TrConst implements TrExp {
	constructor(public readonly value: number) {}
	isConstant() {
		return this.value;
	}
	compile(asm: Assembler) {
		asm.intro(this.value);
	}
}

export class TrVolatile implements TrExp {
	constructor(private readonly behind: TrExp) {}
	isConstant() {
		return undefined;
	}
	compile(asm: Assembler, ps: ProgramScope) {
		this.behind.compile(asm, ps);
	}
}
