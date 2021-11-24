import { InstrSink, RelocationSymbol, TTI } from "@chlorophytum/hltt-next-backend";

export type BufferRelocationPlace = {
	readonly position: number;
	readonly size: number;
	readonly symbol: RelocationSymbol;
};

export class BufferWithRelocations {
	constructor(public buffer: Buffer, public relocations: BufferRelocationPlace[]) {}
	static combine(head: null | undefined | Buffer, segments: BufferWithRelocations[]) {
		const resultBuffer: Buffer[] = [],
			resultRelocations: BufferRelocationPlace[] = [];
		let d = 0;
		if (head) {
			resultBuffer.push(head);
			d += head.byteLength;
		}
		for (const segment of segments) {
			resultBuffer.push(segment.buffer);
			for (const reloc of segment.relocations) {
				resultRelocations.push({
					position: reloc.position + d,
					size: reloc.size,
					symbol: reloc.symbol
				});
			}
			d += segment.buffer.byteLength;
		}
		return new BufferWithRelocations(Buffer.concat(resultBuffer), resultRelocations);
	}
}

class BufferInstrSink implements InstrSink<BufferWithRelocations> {
	private capacity = 16;
	private length = 0;
	private buffer = Buffer.alloc(16);
	private relocations: BufferRelocationPlace[] = [];

	public getLength() {
		return this.length;
	}
	public getResult() {
		return new BufferWithRelocations(this.buffer.slice(0, this.length), this.relocations);
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
		this.relocations = [];
	}
	public addOp(x: TTI) {
		this.addByte(x);
	}
	public addByte(x: number, rs?: null | undefined | RelocationSymbol) {
		this.reserve(1);
		this.buffer.writeUInt8(x & 0xff, this.length);
		if (rs) this.relocations.push({ symbol: rs, position: this.length, size: 1 });
		this.length += 1;
	}
	public addWord(x: number, rs?: null | undefined | RelocationSymbol) {
		this.reserve(2);
		this.buffer.writeUInt16BE(x & 0xffff, this.length);
		if (rs) this.relocations.push({ symbol: rs, position: this.length, size: 2 });
		this.length += 2;
	}
}

export const BufferInstr = {
	createSink(): InstrSink<BufferWithRelocations> {
		return new BufferInstrSink();
	}
};
