import { EdslGlobal, EdslProgramStore } from "./edsl";
import { TtStat } from "./edsl/stat";

export * as Ast from "./ast/index";
export * as Edsl from "./edsl/index";
export { TtStat } from "./edsl/stat";
export { InstrFormat, InstrSink, TextInstr, TTI } from "./instr";
export { initStdLib } from "./stdlib/init-stdlib";

export function CreateDSL(store: EdslProgramStore, stat?: TtStat) {
	return new EdslGlobal(store, stat);
}
