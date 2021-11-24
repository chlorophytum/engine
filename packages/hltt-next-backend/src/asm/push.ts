import { __values } from "tslib";

import { BinaryInstrSink, InstrSink, RelocationSymbol, TTI } from "../instr";

import { PushValue, TtAsmInstr } from "./asm-instr";

export class PushSequence implements TtAsmInstr {
	values: PushValue[] = [];

	add(...xs: PushValue[]) {
		for (const x of xs) this.values.push(x);
	}

	public codeGen<R>(seq: InstrSink<R>) {
		const values = this.values;
		const run = new Run();
		if (values.length) {
			for (let j = 0; j < values.length; j++) {
				const cur = values[j];
				const next = j + 1 < values.length ? values[j + 1] : cur;
				const accepted = run.tryAccept(cur, next);
				if (!accepted) {
					run.flush(seq);
					run.init(cur);
				}
			}
			run.flush(seq);
		}
	}
	toBuffer() {
		const xs = new BinaryInstrSink();
		this.codeGen(xs);
		return xs.getResult();
	}
}

class Run {
	values: number[] = [];
	relocationSymbols: (null | RelocationSymbol)[] = [];
	isByte: boolean = false;

	private pushValue(x: PushValue) {
		if (typeof x === "number") {
			this.values.push(x);
			this.relocationSymbols.push(null);
		} else {
			const n = x.resolve();
			const s = x.asRelocatable()?.resolveSymbol() || null;
			this.values.push(n);
			this.relocationSymbols.push(s);
		}
	}
	private pvIsByte(x: PushValue): boolean {
		if (typeof x === "number") return x >= 0 && x < 0x100;
		else if (!x.allowByte) return false;
		else return this.pvIsByte(x.resolve());
	}

	init(x: PushValue) {
		this.pushValue(x);
		this.isByte = this.pvIsByte(x);
	}
	tryAccept(x: PushValue, next: PushValue) {
		if (this.values.length >= 0xff) return false; // too many args
		if (this.isByte) {
			if (this.pvIsByte(x)) {
				this.pushValue(x);
				return true;
			} else {
				return false;
			}
		} else {
			if (this.pvIsByte(x) && this.pvIsByte(next)) {
				return false;
			} else {
				this.pushValue(x);
				return true;
			}
		}
	}
	flush<R>(sink: InstrSink<R>) {
		if (!this.values.length) return;
		if (this.isByte) {
			if (this.values.length <= 8) {
				sink.addOp(TTI.PUSHB_1 + this.values.length - 1);
			} else {
				sink.addOp(TTI.NPUSHB);
				sink.addByte(this.values.length);
			}
			for (let i = 0; i < this.values.length; i++) {
				sink.addByte(this.values[i], this.relocationSymbols[i]);
			}
		} else {
			if (this.values.length <= 8) {
				sink.addOp(TTI.PUSHW_1 + this.values.length - 1);
			} else {
				sink.addOp(TTI.NPUSHW);
				sink.addByte(this.values.length);
			}
			for (let i = 0; i < this.values.length; i++) {
				sink.addWord(this.values[i], this.relocationSymbols[i]);
			}
		}
		// Clear values and relocation symbols
		this.values.length = 0;
		this.relocationSymbols.length = 0;
	}
}
