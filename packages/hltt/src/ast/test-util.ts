import Assembler from "../asm";

import { VariableFactory } from "./expression/variable";
import { EdslGlobalScope, EdslProgramScope, Statement } from "./interface";
import { BeginStatement } from "./statement/begin";
import { LastReturnStatement } from "./statement/return";
import { SequenceStatement } from "./statement/sequence";

export function compileProgram(
	fn: (gs: EdslGlobalScope, ls: EdslProgramScope) => Iterable<Statement>
) {
	const gs = new EdslGlobalScope(VariableFactory, { resolve: () => undefined });
	const ls = new EdslProgramScope(gs, false, VariableFactory.local);
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
	program.compile(asm, ls);
	return asm;
}
export function compileFdef(
	fn: (gs: EdslGlobalScope, ls: EdslProgramScope) => Iterable<Statement>
) {
	const gs = new EdslGlobalScope(VariableFactory, { resolve: () => undefined });
	const ls = new EdslProgramScope(gs, true, VariableFactory.local);
	const program = new SequenceStatement(fn(gs, ls));
	gs.assignID();
	ls.assignID();

	const asm = new Assembler();
	ls.return = asm.createLabel();
	new BeginStatement().compile(asm, ls);
	program.compile(asm, ls);
	new LastReturnStatement(new Array(ls.returnArity || 0).fill(0)).compile(asm, ls);
	asm.blockBegin(ls.return);
	return asm;
}
export function compileCompositeProgram(
	gs: EdslGlobalScope,
	ls: EdslProgramScope,
	fn: (gs: EdslGlobalScope, ls: EdslProgramScope) => Iterable<Statement>
) {
	const program = new SequenceStatement(fn(gs, ls));
	gs.assignID();
	ls.assignID();

	const asm = new Assembler();
	program.compile(asm, ls);
	return asm;
}
