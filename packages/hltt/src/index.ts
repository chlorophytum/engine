import { GlobalDsl, ProgramStore } from "./edsl";
import { TtStat } from "./edsl/stat";

export * as Edsl from "./edsl/index";
export { TtStat } from "./edsl/stat";
export { InstrFormat, InstrSink, TextInstr, TTI } from "./instr";
export { initStdLib } from "./stdlib/init-stdlib";

export function CreateDSL(store: ProgramStore, stat?: TtStat) {
	return new GlobalDsl(store, stat);
}
