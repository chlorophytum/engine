import test from "ava";

import { compileProgram } from "../ast/test-util";
import { TextInstr } from "../instr";

import { EdslGlobal, EdslProgram } from ".";
import { TtStat } from "./stat";

test("EDSL flags test", t => {
	const asm = compileProgram(function*(gs, ls) {
		const edsl = new EdslProgram(new EdslGlobal(), ls);
		const t0 = edsl.twilight();
		const t1 = edsl.twilight();
		yield edsl.mdap.round(t1); // Bitwise negating a point means referring a twilight
		yield edsl.mdrp(t1, 2);
		yield edsl.mdrp.rp0.black(2, 3);
		yield edsl.mdrp.rp0.black(3, 4);
	});
	t.deepEqual(
		asm.codeGen(TextInstr.createSink()),
		TextInstr.rectify(`
			PUSHB_7 4 3 2 1 2 1 0
			SZP0
			MDAP_rnd
			MDRP_grey
			SZP0
			SRP0
			MDRP_rp0_black
			MDRP_rp0_black`)
	);
	t.is(asm.getRegister("rp0"), 4);
	t.is(asm.getRegister("rp1"), 3);
	t.is(asm.getRegister("rp2"), 4);
});
test("EDSL coercion test", t => {
	const asm = compileProgram(function*(gs, ls) {
		const edsl = new EdslProgram(new EdslGlobal(), ls);
		yield edsl.miap(0, edsl.coerce.fromIndex.cvt(edsl.add(2, 3)).index);
	});
	t.deepEqual(
		asm.codeGen(TextInstr.createSink()),
		TextInstr.rectify(`
			PUSHB_3 0 2 3
			ADD
			MIAP_noRnd`)
	);
});

test("EDSL function linking", t => {
	const stat: TtStat = {};
	const eg = new EdslGlobal(stat);
	// Functions
	const inc = eg.defineFunction("increase", function*(e) {
		const [x] = e.args(1);
		yield e.return(e.add(x, 1));
	});
	const inc1 = eg.defineFunction("increase", function*(e) {
		const [x] = e.args(1);
		yield e.return(e.add(x, 2));
	});
	t.is(inc, inc1);
	const double = eg.defineFunction("double", function*(e) {
		const [x] = e.args(1);
		yield e.return(x, x);
	});
	const plus = eg.defineFunction("plus", function*(e) {
		const [x, y] = e.args(2);
		yield e.return(e.add(x, y));
	});
	const plus3 = eg.defineFunction("plus3", function*(e) {
		const [x, y, z] = e.args(3);
		yield e.return(e.call(plus, x, e.call(plus, y, z)));
	});

	// Glyph program
	const glyph = eg.program(function*(e) {
		yield e.call(inc, e.call(inc, 1));
		yield e.call(plus, e.call(double, 3));
	});

	const fns = eg.compileFunctions(TextInstr);

	t.deepEqual(
		fns.get(inc),
		TextInstr.rectify(`
			PUSHB_1 0
			FDEF
			DUP
			PUSHB_1 1
			ADD
			SWAP
			POP
			ENDF`)
	);
	t.deepEqual(
		fns.get(double),
		TextInstr.rectify(`
			PUSHB_1 1
			FDEF
			DUP
			PUSHB_1 2
			CINDEX
			ROLL
			POP
			ENDF`)
	);

	t.deepEqual(
		eg.compileProgram(glyph, TextInstr),
		TextInstr.rectify(`
			PUSHB_2 0 1
			WS
			PUSHB_2 1 0
			CALL
			PUSHB_1 0
			CALL
			PUSHB_2 3 1
			CALL
			PUSHB_1 2
			CALL`)
	);

	t.log(stat);
});

test("EDSL stat -- recursive", t => {
	const stat: TtStat = {};
	const eg = new EdslGlobal(stat);
	const add = eg.declareFunction("add");

	eg.defineFunction(add, function*(e) {
		const [x, y] = e.args(2);
		yield e.if(
			e.lteq(x, 0),
			function*() {
				yield e.return(y);
			},
			function*() {
				yield e.return(e.call(add, e.sub(x, 1), e.add(y, 1)));
			}
		);
	});

	const fns = eg.compileFunctions(TextInstr);

	t.deepEqual(
		fns.get(add),
		TextInstr.rectify(`
			PUSHB_1 0
			FDEF
				PUSHB_1 2
				CINDEX
				PUSHB_1 0
				LTEQ
				IF
					DUP
					SWAP
					POP
					SWAP
					POP
					PUSHB_1 30
					JMPR
					PUSHB_1 0
				ELSE
					PUSHB_1 2
					CINDEX
					PUSHB_1 1
					SUB
					PUSHB_1 2
					CINDEX
					PUSHB_1 1
					ADD
					PUSHB_1 0
					CALL
					SWAP
					POP
					SWAP
					POP
					PUSHB_1 5
					JMPR
					PUSHB_1 0
				EIF
				POP
			ENDF
	`)
	);

	t.log(stat);
});
