import Assembler from "../asm";
import { TTI } from "../instr";
import { VarKind } from "./interface";

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
