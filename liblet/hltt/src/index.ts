import { Expression, PointerExpression } from "./ast/interface";
import {
	EdslDefineFunctionTemplate,
	EdslDefineLibraryFunction,
	EdslFunctionTemplate,
	EdslGlobal,
	EdslProgram,
	EdslProgramRecord,
	EdslProgramStore
} from "./edsl";
import { TtStat } from "./edsl/stat";

export default function createDSL(stat?: TtStat) {
	return new EdslGlobal(stat);
}

export * from "./ast/index";
export { TtStat } from "./edsl/stat";
export { TTI, InstrFormat, InstrSink, TextInstr } from "./instr";
export type ProgramDsl = EdslProgram;
export type GlobalDsl = EdslGlobal;
export type ProgramRecord = EdslProgramRecord;
export type ProgramStore = EdslProgramStore;
export type FunctionTemplate<A extends any[]> = EdslFunctionTemplate<A>;
export const Template = EdslDefineFunctionTemplate;
export const LibFunc = EdslDefineLibraryFunction;

export type NE = number | Expression;
export type NPE = number | PointerExpression;
