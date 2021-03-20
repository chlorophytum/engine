import { InstrSink, TTI } from "@chlorophytum/hltt-next-backend";

class BufferInstrSink implements InstrSink<Buffer> {
	private capacity = 16;
	private length = 0;
	private buffer = Buffer.alloc(16);

	public getLength() {
		return this.length;
	}
	public getResult() {
		return this.buffer.slice(0, this.length);
	}
	private reserve(size: number) {
		if (this.length + size >= this.capacity) {
			this.capacity += Math.min(this.capacity, 0x100);
			const bufNew = Buffer.alloc(this.capacity);
			this.buffer.copy(bufNew, 0);
			this.buffer = bufNew;
		}
	}
	public reset() {
		this.capacity = 16;
		this.length = 0;
		this.buffer = Buffer.alloc(16);
	}
	public addOp(x: TTI) {
		this.addByte(x);
	}
	public addByte(x: number) {
		this.reserve(1);
		this.buffer.writeUInt8(x & 0xff, this.length);
		this.length += 1;
	}
	public addWord(x: number) {
		this.reserve(1);
		this.buffer.writeUInt16BE(x & 0xffff, this.length);
		this.length += 2;
	}
}

export const BufferInstr = {
	createSink(): InstrSink<Buffer> {
		return new BufferInstrSink();
	}
};
