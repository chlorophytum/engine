import { Expression, PointerExpression } from "./ast/interface";
import { EdslGlobal, EdslProgram, EdslProgramRecord, EdslProgramStore } from "./edsl";
import { TtStat } from "./edsl/stat";

export default function createDSL(stat?: TtStat) {
	return new EdslGlobal(stat);
}

export * from "./ast/index";
export {
	EdslFunctionTemplate,
	EdslFunctionTemplateInst,
	EdslLibrary as TtLibrary
} from "./edsl/index";
export { TtStat } from "./edsl/stat";
export { InstrFormat, InstrSink, TextInstr, TTI } from "./instr";
export { initStdLib } from "./stdlib/init-stdlib";
export type ProgramDsl = EdslProgram;
export type GlobalDsl = EdslGlobal;
export type ProgramRecord = EdslProgramRecord;
export type ProgramStore = EdslProgramStore;

export type NE = number | Expression;
export type NPE = number | PointerExpression;
