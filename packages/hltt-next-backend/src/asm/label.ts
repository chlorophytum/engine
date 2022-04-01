import { InstrSink, RelocationScope } from "../instr";

import { IPushValue, TtAsmInstr } from "./asm-instr";
import { TtRelocatable } from "./relocatable";

export class TtLabel implements TtAsmInstr {
	public readonly symbol;
	public offset: number = 0;
	constructor() {
		this.symbol = Symbol();
	}
	codeGen<R>(sink: InstrSink<R>) {
		if (sink.addLabel) {
			sink.addLabel(this.resolveSymbol());
		}
	}
	resolveSymbol() {
		return {
			scope: RelocationScope.JumpLabel,
			symbol: this.symbol,
			offset: 0
		};
	}
	setOffset(x: number, round: number) {
		const offsetChanged = this.offset !== x;
		this.offset = x;
		return offsetChanged;
	}
}

export class ProgramBoundary implements TtAsmInstr {
	private readonly symbol;
	constructor(private readonly scope: RelocationScope) {
		this.symbol = Symbol();
	}
	codeGen<R>(sink: InstrSink<R>) {
		if (sink.addLabel) {
			sink.addLabel({ scope: this.scope, symbol: this.symbol, offset: 0 });
		}
	}
}

export class TtLabelDifference implements IPushValue {
	public readonly symbol;
	constructor(public from: TtLabel, public to: TtLabel) {
		this.symbol = Symbol();
	}
	get allowByte() {
		return false;
	}
	resolve() {
		return this.to.offset - this.from.offset;
	}
	asRelocatable() {
		return new TtRelocatable(RelocationScope.JumpOffset, this.symbol, 0, 0);
	}
}

export class TtCPushValueRef implements TtAsmInstr {
	constructor(private cpv: IPushValue) {}
	last: number | undefined = undefined;
	codeGen() {
		const current = this.cpv.resolve();
		const changed = current !== this.last;
		this.last = current;
		return changed;
	}
}
