import { InstrSink, RelocationSymbol } from "../instr";

export interface TtAsmInstr {
	codeGen<R>(sink: InstrSink<R>, round: number): void | undefined | boolean;
	setOffset?(x: number, round: number): void | undefined | boolean;
}
export interface IPushValue {
	readonly allowByte: boolean;
	resolve(): number;
	asRelocatable(): null | undefined | IRelocatablePushValue;
}
export type PushValue = number | IPushValue;

export interface IRelocatablePushValue extends IPushValue {
	resolveSymbol(): RelocationSymbol;
	withOffset(n: number): IRelocatablePushValue;
}
export type RelocatablePushValue = number | IRelocatablePushValue;

export function resolveRelocatablePushValue(n: RelocatablePushValue) {
	if (typeof n === "number") return n;
	else return n.resolve();
}
export function offsetRelocatablePushValue(n: RelocatablePushValue, offset: number) {
	if (!offset) return n;
	if (typeof n === "number") return n + offset;
	else return n.withOffset(offset);
}
