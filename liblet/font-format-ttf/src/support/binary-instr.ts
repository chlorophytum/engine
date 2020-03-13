import { InstrSink, TTI } from "@chlorophytum/hltt";

export class Base64InstrSink implements InstrSink<string> {
	private xs: number[] = [];
	public getLength() {
		return this.xs.length;
	}
	public getResult() {
		return Buffer.from(new Uint8Array(this.xs)).toString("base64");
	}
	public reset() {
		this.xs.length = 0;
	}
	public addOp(x: TTI) {
		this.xs.push(x);
	}
	public addByte(x: number) {
		this.xs.push(x & 0xff);
	}
	public addWord(x: number) {
		const highByte = (x & 0xff00) >>> 8;
		const lowByte = x & 0xff;
		this.xs.push(highByte, lowByte);
	}
}

export const Base64Instr = {
	createSink(): InstrSink<string> {
		return new Base64InstrSink();
	},
	decode(hint: string) {
		return Buffer.from(hint, "base64");
	}
};
