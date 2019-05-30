import { __values } from "tslib";

import { BinaryInstrSink, InstrSink, TTI } from "../instr";

import { PushValue, TtIR } from "./ir";

export class PushSequence implements TtIR {
	values: (PushValue)[] = [];

	add(...xs: (PushValue)[]) {
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
	isByte: boolean = false;

	private toNum(x: PushValue) {
		if (typeof x === "number") return x;
		else return x.resolve();
	}
	private pvIsByte(x: PushValue): boolean {
		if (typeof x === "number") return x >= 0 && x < 0x100;
		else if (!x.allowByte) return false;
		else return this.pvIsByte(x.resolve());
	}

	init(x: PushValue) {
		this.values.push(this.toNum(x));
		this.isByte = this.pvIsByte(x);
	}
	tryAccept(x: PushValue, next: PushValue) {
		if (this.values.length >= 0xff) return false; // too many args
		if (this.isByte) {
			if (this.pvIsByte(x)) {
				this.values.push(this.toNum(x));
				return true;
			} else {
				return false;
			}
		} else {
			if (this.pvIsByte(x) && this.pvIsByte(next)) {
				return false;
			} else {
				this.values.push(this.toNum(x));
				return true;
			}
		}
	}
	flush<R>(seq: InstrSink<R>) {
		if (!this.values.length) return;
		if (this.isByte) {
			if (this.values.length <= 8) {
				seq.addOp(TTI.PUSHB_1 + this.values.length - 1);
			} else {
				seq.addOp(TTI.NPUSHB);
				seq.addByte(this.values.length);
			}
			for (const x of this.values) {
				seq.addByte(x);
			}
		} else {
			if (this.values.length <= 8) {
				seq.addOp(TTI.PUSHW_1 + this.values.length - 1);
			} else {
				seq.addOp(TTI.NPUSHW);
				seq.addByte(this.values.length);
			}
			for (const x of this.values) {
				seq.addWord(x);
			}
		}
		this.values.length = 0; // Clear values
	}
}
