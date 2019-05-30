import Assembler from "../ir";
import { GlobalScope, ProgramScope } from "../scope";

import { VariableFactory } from "./expression/variable";
import { Statement, Variable } from "./interface";
import { BeginStatement } from "./statement/begin";
import { LastReturnStatement } from "./statement/return";
import { SequenceStatement } from "./statement/sequence";

export function compileProgram(
	fn: (gs: GlobalScope<Variable>, ls: ProgramScope<Variable>) => Iterable<Statement>
) {
	const gs = new GlobalScope(VariableFactory);
	const ls = new ProgramScope(gs, false, VariableFactory.local);
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
	program.refer(asm);
	program.compile(asm);
	return asm;
}
export function compileFdef(
	fn: (gs: GlobalScope<Variable>, ls: ProgramScope<Variable>) => Iterable<Statement>
) {
	const gs = new GlobalScope(VariableFactory);
	const ls = new ProgramScope(gs, true, VariableFactory.local);
	const program = new SequenceStatement(fn(gs, ls));
	gs.assignID();
	ls.assignID();

	const asm = new Assembler();
	ls.return = asm.createLabel();
	new BeginStatement(ls).compile(asm);
	program.refer(asm);
	program.compile(asm);
	new LastReturnStatement(ls, new Array(ls.returnArity || 0).fill(0)).compile(asm);
	asm.blockBegin(ls.return);
	return asm;
}
export function compileCompositeProgram(
	gs: GlobalScope<Variable>,
	ls: ProgramScope<Variable>,
	fn: (gs: GlobalScope<Variable>, ls: ProgramScope<Variable>) => Iterable<Statement>
) {
	const program = new SequenceStatement(fn(gs, ls));
	gs.assignID();
	ls.assignID();

	const asm = new Assembler();
	program.refer(asm);
	program.compile(asm);
	return asm;
}
