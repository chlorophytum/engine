import { RelocationScope } from "../instr";

import { IRelocatablePushValue } from "./asm-instr";

export class TtRelocatable implements IRelocatablePushValue {
	constructor(
		private readonly scope: RelocationScope,
		private readonly symbol: symbol,
		private base: number,
		private offset: number
	) {}
	public readonly allowByte = false;
	public resolve() {
		return this.base + this.offset;
	}
	public asRelocatable() {
		return this;
	}
	public resolveSymbol() {
		return { scope: this.scope, symbol: this.symbol, offset: this.offset };
	}
	public withOffset(offset: number) {
		return new TtRelocatable(this.scope, this.symbol, this.base, this.offset + offset);
	}
}
