import { CPushValue, TtAsmInstr } from "./asm-instr";

export class TtLabel implements TtAsmInstr {
	offset: number = 0;
	allowByte: boolean = true;
	codeGen() {}
	setOffset(x: number, round: number) {
		const offsetChanged = this.offset !== x;
		this.offset = x;
		this.allowByte = round < 4;
		return offsetChanged;
	}
}

export class TtLabelDifference implements CPushValue {
	constructor(private a: TtLabel, private b: TtLabel) {}
	get allowByte() {
		return this.b.allowByte && this.a.allowByte;
	}
	resolve() {
		return this.b.offset - this.a.offset;
	}
}

export class TtCPushValueRef implements TtAsmInstr {
	constructor(private cpv: CPushValue) {}
	last: number | undefined = undefined;
	codeGen() {
		const current = this.cpv.resolve();
		const changed = current !== this.last;
		this.last = current;
		return changed;
	}
}
