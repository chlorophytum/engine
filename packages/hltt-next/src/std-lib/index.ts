import { GlobalScope, StdLibImpl as STL } from "@chlorophytum/hltt-next-tr";

import { StdLibFuncDecl } from "../edsl/lib-system/programs";

const PtrLocal = new StdLibFuncDecl(STL.PtrLocal, 1, 1, new STL.TrStdLib_PtrLocal());
const AbiProlog = new StdLibFuncDecl(STL.AbiProlog, 1, 0, new STL.TrStdLib_AbiProlog());
const AbiEpilog = new StdLibFuncDecl(STL.AbiEpilog, 1, 0, new STL.TrStdLib_AbiEpilog());
const AbiEpilogPR = new StdLibFuncDecl(STL.AbiEpilogPR, 2, 1, new STL.TrStdLib_AbiEpilogPR());
const AbiEpilogPNR = new StdLibFuncDecl(STL.AbiEpilogPNR, 1, 0, new STL.TrStdLib_AbiEpilogPNR());

export function addStdLib(gs: GlobalScope) {
	PtrLocal.register(gs);
	AbiProlog.register(gs);
	AbiEpilog.register(gs);
	AbiEpilogPR.register(gs);
	AbiEpilogPNR.register(gs);
}
