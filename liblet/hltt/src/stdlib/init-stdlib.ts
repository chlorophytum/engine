import Assembler from "../asm";
import { TtGlobalScope } from "../ast/scope";
import { GlobalDsl } from "../edsl";
import { TTI } from "../instr";

export function initStdLib(edsl: GlobalDsl) {
	edsl.scope.useStdLib = true;
	// Long point standard libraries
	StdLib.setZoneLp.zp0.register(edsl);
	StdLib.setZoneLp.zp1.register(edsl);
	StdLib.setZoneLp.zp2.register(edsl);
	StdLib.getLocalVariable.register(edsl);
}

export class Inliner {
	constructor(
		private readonly name: string,
		private readonly argsArity: number,
		private readonly returnArity: number,
		private Asm: (a: Assembler, gs: TtGlobalScope) => void
	) {}

	public register(edsl: GlobalDsl) {
		edsl.defineAssemblyFunction(this.name, this.argsArity, this.returnArity, a =>
			this.Asm(a, edsl.scope)
		);
	}
	public inline(gs: TtGlobalScope, asm: Assembler) {
		if (gs.useStdLib) {
			gs.fpgm.declare(this.name).compilePtr(asm);
			asm.prim(TTI.CALL, 1 + this.argsArity, this.returnArity);
		} else {
			this.Asm(asm, gs);
		}
	}
}

export const StdLib = {
	setZoneLp: {
		zp0: new Inliner(`stdlib::set-zone-lp-zp0`, 1, 1, function (asm, gs) {
			asm.pseudoPrim(1, 1, 3)
				.prim(TTI.DUP)
				.push(0)
				.prim(TTI.LT)
				.prim(TTI.IF)
				.prim(TTI.NEG)
				.push(1)
				.prim(TTI.SUB)
				.push(0)
				.prim(TTI.SZP0)
				.prim(TTI.ELSE)
				.push(1)
				.prim(TTI.SZP0)
				.prim(TTI.EIF);
		}),
		zp1: new Inliner(`stdlib::set-zone-lp-zp1`, 1, 1, function (asm, gs) {
			asm.pseudoPrim(1, 1, 3)
				.prim(TTI.DUP)
				.push(0)
				.prim(TTI.LT)
				.prim(TTI.IF)
				.prim(TTI.NEG)
				.push(1)
				.prim(TTI.SUB)
				.push(0)
				.prim(TTI.SZP1)
				.prim(TTI.ELSE)
				.push(1)
				.prim(TTI.SZP1)
				.prim(TTI.EIF);
		}),
		zp2: new Inliner(`stdlib::set-zone-lp-zp2`, 1, 1, function (asm, gs) {
			asm.pseudoPrim(1, 1, 3)
				.prim(TTI.DUP)
				.push(0)
				.prim(TTI.LT)
				.prim(TTI.IF)
				.prim(TTI.NEG)
				.push(1)
				.prim(TTI.SUB)
				.push(0)
				.prim(TTI.SZP2)
				.prim(TTI.ELSE)
				.push(1)
				.prim(TTI.SZP2)
				.prim(TTI.EIF);
		})
	},
	getLocalVariable: new Inliner(`stdlib::local-variable-ptr`, 1, 1, function (asm, gs) {
		asm.intro(gs.sp)
			.prim(TTI.RS)
			.deleted(1)
			.added(1)
			.prim(TTI.SWAP)
			.deleted(2)
			.added(2)
			.prim(TTI.SUB)
			.deleted(2)
			.added(1);
	})
};
