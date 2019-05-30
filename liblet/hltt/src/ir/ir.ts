import { InstrSink } from "../instr";

export interface TtIR {
	codeGen<R>(sink: InstrSink<R>, round: number): void | undefined | boolean;
	setOffset?(x: number, round: number): void | undefined | boolean;
}
export interface CPushValue {
	readonly allowByte: boolean;
	resolve(): number;
}
export type PushValue = number | CPushValue;
