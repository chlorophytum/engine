import { GlobalScope, ProgramScope } from "./scope";
import { TrStmt } from "./tr";

export interface Decl {
	populateInterface(gs: GlobalScope): symbol;
}
export interface Def<T> extends Decl {
	populateDefinition(gs: GlobalScope): T;
}
