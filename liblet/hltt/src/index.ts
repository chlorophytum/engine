import { Expression, PointerExpression } from "./ast/interface";
import { EdslGlobal, EdslProgram, EdslProgramRecord, EdslProgramStore } from "./edsl";
import { TtStat } from "./edsl/stat";

export function CreateDSL(store: EdslProgramStore, stat?: TtStat) {
	return new EdslGlobal(store, stat);
}

export * from "./ast/index";
export { EdslSymbolTemplate, EdslSymbol, EdslLibrary as TtLibrary } from "./edsl/index";
export { TtStat } from "./edsl/stat";
export { InstrFormat, InstrSink, TextInstr, TTI } from "./instr";
export { initStdLib } from "./stdlib/init-stdlib";
export type ProgramDsl = EdslProgram;
export type GlobalDsl = EdslGlobal;
export type ProgramRecord = EdslProgramRecord;
export type ProgramStore = EdslProgramStore;

export type NE = number | Expression;
export type NPE = number | PointerExpression;
