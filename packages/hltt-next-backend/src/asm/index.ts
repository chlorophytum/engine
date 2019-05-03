import { InstrSink, RelocationScope, TTI } from "../instr";

import { IPushValue, PushValue, TtAsmInstr } from "./asm-instr";
import { ProgramBoundary, TtCPushValueRef, TtLabel, TtLabelDifference } from "./label";
import { JumpIR, PrimIR, PseudoPrimIR } from "./prim";
import { PushSequence } from "./push";

// We track accessible to optimize positions of PUSH instructions
interface Rise {
	pushes?: PushSequence | null; // Is it a push rise?
	startHeight: number;
}

export interface Registers {
	zp0?: number;
	rp0?: number;
	zp1?: number;
	rp1?: number;
	zp2?: number;
	rp2?: number;
	loop?: number;
}

export default class Assembler {
	private rises: Rise[];
	private stackHeight = 0;

	private irs: TtAsmInstr[] = [];
	public maxStackHeight = 0;
	private registers: Registers = {};

	constructor() {
		this.rises = [{ startHeight: -0xffff }];
	}

	private updateMaxStackHeight() {
		if (this.stackHeight > this.maxStackHeight) this.maxStackHeight = this.stackHeight;
	}
	public ir(ir: TtAsmInstr) {
		this.irs.push(ir);
		return this;
	}
	private rawPush(...xs: PushValue[]) {
		const seq = new PushSequence();
		for (const x of xs) {
			seq.add(x);
		}
		this.ir(seq);
		this.updateMaxStackHeight();
		return this;
	}
	private push(...xs: PushValue[]) {
		this.added(xs.length);
		this.rawPush(...xs);
		return this;
	}
	public intro(...xs: PushValue[]) {
		let pSeg = this.rises[0];
		if (!pSeg.pushes) {
			// We are behind a non-push rise
			// Create a new push rise
			const seq = new PushSequence();
			this.irs.push(seq);
			pSeg = { pushes: seq, startHeight: this.stackHeight };
			this.rises.unshift(pSeg);
		}

		for (const x of xs) {
			if (this.stackHeight < pSeg.startHeight) throw new RangeError("Insufficient Stack");
			pSeg.pushes!.values.splice(this.stackHeight - pSeg.startHeight, 0, x);
			this.stackHeight++;
		}
		if (pSeg.pushes!.values.length + pSeg.startHeight > this.maxStackHeight) {
			this.maxStackHeight = pSeg.pushes!.values.length + pSeg.startHeight;
		}
		this.updateMaxStackHeight();
		return this;
	}
	public prim(x: TTI, deleted: number = 0, added: number = 0) {
		this.ir(new PrimIR(x));
		this.deleted(deleted);
		this.added(added);
		return this;
	}
	public jumpPrim(x: TTI, offset: TtLabelDifference, deleted: number = 0, added: number = 0) {
		this.ir(new JumpIR(x, offset));
		this.deleted(deleted);
		this.added(added);
		return this;
	}
	public pseudoPrim(deleted: number = 0, added: number = 0, maxRise: number = 0) {
		const pp = new PseudoPrimIR();
		this.ir(pp);
		this.deleted(deleted);
		this.added(maxRise);
		this.deleted(maxRise);
		this.added(added);
		return pp;
	}

	private canRemoveRise(rise: Rise) {
		if (rise.pushes) return rise.startHeight > this.stackHeight;
		else return rise.startHeight >= this.stackHeight;
	}

	public deleted(n: number) {
		if (!n) return this;
		if (this.stackHeight < n) throw new RangeError("Insufficient Stack");
		this.stackHeight -= n;
		while (this.canRemoveRise(this.rises[0])) this.rises.shift();
		return this;
	}
	public added(n: number) {
		if (!n) return this;
		this.stackHeight += n;
		// Create a non-push rise
		this.rises.unshift({ startHeight: this.stackHeight - n });
		this.updateMaxStackHeight();
		return this;
	}

	// Utility stack manipulators
	public balanceStack(h: number) {
		this.needAccurateStackHeight();
		while (this.stackHeight < h) {
			this.intro(0);
		}
		while (this.stackHeight > h) {
			this.prim(TTI.POP).deleted(1);
		}
		return h;
	}
	public funcReturnKeepDelete(returnArity: number) {
		this.needAccurateStackHeight();
		while (this.stackHeight > returnArity) {
			if (returnArity) {
				if (returnArity === 1) {
					this.prim(TTI.SWAP);
				} else if (returnArity === 2) {
					this.prim(TTI.ROLL);
				} else {
					this.push(returnArity + 1);
					this.prim(TTI.MINDEX).deleted(1);
				}
			}
			this.prim(TTI.POP).deleted(1);
		}
	}
	public nthFromBottom(index: number) {
		this.needAccurateStackHeight();
		const offset = this.stackHeight - index; // pseudoPrim() changes SH, so compute offset first
		if (offset === 1) {
			this.prim(TTI.DUP, 0, 1);
		} else {
			this.pseudoPrim(0, 1, 2).push(offset).prim(TTI.CINDEX);
		}
	}

	// Drop all rises
	public needAccurateStackHeight(h = this.stackHeight) {
		const h0 = this.stackHeight;
		this.stackHeight = h;
		this.rises = [{ startHeight: -0xffff }];
		return h0;
	}
	public label(ref?: TtLabel) {
		return this.blockBegin(ref);
	}
	public blockBegin(ref?: TtLabel) {
		this.forgetRegisters();
		const h0 = this.needAccurateStackHeight(this.stackHeight);
		if (ref) this.ir(ref);
		return h0;
	}
	public blockEnd(h: number, ref?: TtLabel) {
		this.forgetRegisters();
		if (ref) this.ir(ref);
		return this.balanceStack(h);
	}
	public softBlockBegin(ref?: TtLabel) {
		const h0 = this.needAccurateStackHeight(this.stackHeight);
		if (ref) this.ir(ref);
		return h0;
	}
	public softBlockEnd(h: number, ref?: TtLabel) {
		if (ref) this.ir(ref);
		return this.balanceStack(h);
	}
	public programBegin() {
		this.ir(new ProgramBoundary(RelocationScope.ProgramBegin));
	}
	public programEnd() {
		this.ir(new ProgramBoundary(RelocationScope.ProgramEnd));
	}

	// Register management
	public getRegister<K extends keyof Registers>(r: K): number | undefined {
		return this.registers[r];
	}
	public setRegister<K extends keyof Registers>(r: K, x: number | undefined): void {
		this.registers[r] = x;
	}
	public forgetRegister<K extends keyof Registers>(r: K) {
		this.registers[r] = undefined;
	}
	public forgetRegisters() {
		this.registers = {};
	}

	public createLabel(fExport?: boolean) {
		return new TtLabel();
	}
	public createLabelDifference(a: TtLabel, b: TtLabel) {
		return new TtLabelDifference(a, b);
	}
	public refValue(cpv: IPushValue) {
		this.ir(new TtCPushValueRef(cpv));
		return this;
	}

	// Compile!
	public codeGen<R>(xs: InstrSink<R>): R {
		let offsetChanged = false,
			rounds = 0;
		do {
			xs.reset();
			offsetChanged = false;
			rounds++;
			for (const ir of this.irs) {
				if (ir.setOffset) {
					const irOffsetChanged = ir.setOffset(xs.getLength(), rounds);
					offsetChanged = offsetChanged || !!irOffsetChanged;
				}
				const unstable = ir.codeGen(xs, rounds);
				offsetChanged = offsetChanged || !!unstable;
			}
		} while (offsetChanged && rounds < 64);
		if (offsetChanged) throw new Error("Cannot stabilize label offsets.");
		return xs.getResult();
	}
}
