import { Assembler, offsetRelocatablePushValue, TTI } from "@chlorophytum/hltt-next-backend";

import { Decl, ProgramScope } from "../scope";
import * as StdLib from "../std-lib";
import { TrExp, TrVar } from "../tr";

export class TrStorage implements TrVar {
	constructor(public readonly irPtr: TrExp) {}
	isConstant() {
		return undefined;
	}
	compileSet(asm: Assembler, ps: ProgramScope) {
		asm.prim(TTI.WS).deleted(2);
	}
	compile(asm: Assembler, ps: ProgramScope) {
		this.compilePtr(asm, ps);
		asm.prim(TTI.RS).deleted(1).added(1);
	}
	compilePtr(asm: Assembler, ps: ProgramScope) {
		this.irPtr.compile(asm, ps);
	}
}

export class TrCvt implements TrVar {
	constructor(public readonly irPtr: TrExp) {}
	isConstant() {
		return undefined;
	}
	compileSet(asm: Assembler, ps: ProgramScope) {
		asm.prim(TTI.WCVTP).deleted(2);
	}
	compile(asm: Assembler, ps: ProgramScope) {
		this.compilePtr(asm, ps);
		asm.prim(TTI.RCVT).deleted(1).added(1);
	}
	compilePtr(asm: Assembler, ps: ProgramScope) {
		this.irPtr.compile(asm, ps);
	}
}

export class TrOffsetPtr implements TrExp {
	private constructor(private readonly base: TrExp, private readonly offset: TrExp) {}
	isConstant() {
		return undefined;
	}
	compile(asm: Assembler, ps: ProgramScope) {
		this.base.compile(asm, ps);
		this.offset.compile(asm, ps);
		asm.prim(TTI.ADD, 2, 1);
	}
	static from(base: TrExp, offset: TrExp) {
		const cOffset = offset.isConstant();
		if (cOffset === undefined) return new TrOffsetPtr(base, offset);
		else if (cOffset === 0) return base;
		else if (
			base instanceof TrLocalPtr ||
			base instanceof TrGlobalPtr ||
			base instanceof TrCvtPtr
		) {
			return base.withOffset(cOffset);
		} else {
			return new TrOffsetPtr(base, offset);
		}
	}
}

export class TrLocalPtr implements TrExp {
	constructor(private readonly symbol: symbol, private readonly offset: number) {}
	isConstant() {
		return undefined;
	}
	withOffset(offset: number) {
		return new TrLocalPtr(this.symbol, this.offset + offset);
	}
	compile(asm: Assembler, ps: ProgramScope) {
		const id = ps.locals.resolve(this.symbol);
		if (id == null) throw new Error(`Variable ${String(this.symbol)} not declared.`);
		const ifnStdLibPtrLocal = ps.global.fpgm.resolve(StdLib.PtrLocal);
		if (ifnStdLibPtrLocal != null) {
			asm.intro(ps.storageStackFrameSize - (id + this.offset));
			asm.intro(ifnStdLibPtrLocal);
			asm.prim(TTI.CALL).deleted(2).added(1);
		} else {
			StdLib.TrStdLib_PtrLocal.inline(asm, ps, ps.storageStackFrameSize - (id + this.offset));
		}
	}
}

export class TrGlobalPtr implements TrExp {
	constructor(private readonly symbol: symbol, private readonly offset: number) {}
	isConstant() {
		return undefined;
	}
	withOffset(offset: number) {
		return new TrGlobalPtr(this.symbol, this.offset + offset);
	}
	compile(asm: Assembler, ps: ProgramScope) {
		const id = ps.global.storage.resolve(this.symbol);
		if (id == null) throw new Error(`Global storage ${String(this.symbol)} not declared.`);
		asm.intro(offsetRelocatablePushValue(id, this.offset));
	}
}

export class TrCvtPtr implements TrExp {
	constructor(private readonly decl: Decl, private readonly offset: number) {}
	isConstant() {
		return undefined;
	}
	withOffset(offset: number) {
		return new TrCvtPtr(this.decl, this.offset + offset);
	}
	compile(asm: Assembler, ps: ProgramScope) {
		const symbol = this.decl.register(ps.global);
		const id = ps.global.cvt.resolve(symbol);
		if (id == null) throw new Error(`Cvt ${String(symbol)} not declared.`);
		asm.intro(offsetRelocatablePushValue(id, this.offset));
	}
}

export class TrTwilightPointRef implements TrExp {
	constructor(private readonly decl: Decl) {}
	isConstant() {
		return undefined;
	}
	compile(asm: Assembler, ps: ProgramScope) {
		const symbol = this.decl.register(ps.global);
		const id = ps.global.twilightPoints.resolve(symbol);
		if (id == null) throw new Error(`Twilight ${String(symbol)} not declared.`);
		asm.intro(id);
	}
}
