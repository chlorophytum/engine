import Assembler from "../../asm";
import { TTI } from "../../instr";
import { Decl } from "../decl";
import { ProgramScope } from "../scope";
import { Tr, TrExp } from "../tr";

export class TrInvoke implements TrExp {
	constructor(
		private readonly fnDecl: Decl,
		private readonly args: Tr[],
		private readonly returnArity: number // 1 for function, 0 for procedure
	) {}
	isConstant() {
		return undefined;
	}
	compile(asm: Assembler, ps: ProgramScope) {
		const sFn = this.fnDecl.populateInterface(ps.global);
		const iFn = ps.global.fpgm.resolve(sFn);
		if (iFn == null) throw new TypeError(`Function ${String(sFn)} failed to declare.`);
		for (const arg of this.args) arg.compile(asm, ps);
		asm.intro(iFn);
		asm.prim(TTI.CALL)
			.deleted(this.args.length + 1)
			.added(this.returnArity);
		asm.forgetRegisters();
	}
}
