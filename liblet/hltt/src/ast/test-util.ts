import Assembler from "../asm";
import { TtGlobalScopeT, TtProgramScopeT } from "../scope";
import { VariableFactory } from "./expression/variable";
import { Statement } from "./interface";
import { BeginStatement } from "./statement/begin";
import { LastReturnStatement } from "./statement/return";
import { SequenceStatement } from "./statement/sequence";
import { TtGlobalScope, TtProgramScope } from "./scope";

export function compileProgram(fn: (gs: TtGlobalScope, ls: TtProgramScope) => Iterable<Statement>) {
	const gs = new TtGlobalScopeT(VariableFactory);
	const ls = new TtProgramScopeT(gs, false, VariableFactory.local);
	const program = new SequenceStatement(fn(gs, ls));
	gs.assignID();
	ls.assignID();

	const asm = new Assembler();
	asm.setRegister("zp0", 1);
	asm.setRegister("zp1", 1);
	asm.setRegister("zp2", 1);
	asm.setRegister("rp0", 0);
	asm.setRegister("rp1", 0);
	asm.setRegister("rp2", 0);
	asm.setRegister("loop", 1);
	program.compile(asm);
	return asm;
}
export function compileFdef(fn: (gs: TtGlobalScope, ls: TtProgramScope) => Iterable<Statement>) {
	const gs = new TtGlobalScopeT(VariableFactory);
	const ls = new TtProgramScopeT(gs, true, VariableFactory.local);
	const program = new SequenceStatement(fn(gs, ls));
	gs.assignID();
	ls.assignID();

	const asm = new Assembler();
	ls.return = asm.createLabel();
	new BeginStatement(ls).compile(asm);
	program.compile(asm);
	new LastReturnStatement(ls, new Array(ls.returnArity || 0).fill(0)).compile(asm);
	asm.blockBegin(ls.return);
	return asm;
}
export function compileCompositeProgram(
	gs: TtGlobalScope,
	ls: TtProgramScope,
	fn: (gs: TtGlobalScope, ls: TtProgramScope) => Iterable<Statement>
) {
	const program = new SequenceStatement(fn(gs, ls));
	gs.assignID();
	ls.assignID();

	const asm = new Assembler();
	program.compile(asm);
	return asm;
}
