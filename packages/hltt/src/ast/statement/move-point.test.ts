import test from "ava";
import { TextInstrSink } from "../../instr";
import { cExpr, ConstantExpression, VolatileExpression } from "../expression/constant";
import { compileProgram } from "../test-util";
import { AlternativeStatement } from "./branch";
import { LIp, LMdap, LMdrp, LMiap } from "./move-point";

test("Statement: Long MDAP", t => {
	const asm = compileProgram(function* (gs, ls) {
		yield AlternativeStatement.from(
			new LMdap(true, new VolatileExpression(new ConstantExpression(1)))
		);
	});
	t.deepEqual(
		asm.codeGen(new TextInstrSink()),
		TextInstrSink.rectify(`
			PUSHB_1 1
			DUP
			PUSHB_1 0
			LT
			IF
				NEG
				PUSHB_1 1
				SUB
				PUSHB_1 0
				SZP0
			ELSE
				PUSHB_1 1
				SZP0
			EIF
			MDAP_rnd
			`)
	);
});

test("Statement: MIAP", t => {
	const asm = compileProgram(function* (gs, ls) {
		const cvYBaseline = gs.cvt.declare("yBaseline", 1);
		yield AlternativeStatement.from(new LMiap(true, cExpr(2), cvYBaseline.ptr));
	});
	t.deepEqual(
		asm.codeGen(new TextInstrSink()),
		TextInstrSink.rectify(`
			PUSHB_3 2 0 1
			SZP0
			MIAP_rnd
			`)
	);
});

test("Statement: MDRP", t => {
	const asm = compileProgram(function* (gs, ls) {
		yield new LMdap(true, cExpr(~1));
		yield new LMdrp(false, false, false, 0, cExpr(~1), cExpr(2));
		yield new LMdrp(true, false, false, 0, cExpr(2), cExpr(3));
		yield new LMdrp(true, false, false, 0, cExpr(3), cExpr(4));
	});
	t.deepEqual(
		asm.codeGen(new TextInstrSink()),
		TextInstrSink.rectify(`
			PUSHB_7 4 3 2 1 2 1 0
			SZP0
			MDAP_rnd
			MDRP_grey
			SZP0
			SRP0
			MDRP_rp0_grey
			MDRP_rp0_grey`)
	);
	t.is(asm.getRegister("rp0"), 4);
	t.is(asm.getRegister("rp1"), 3);
	t.is(asm.getRegister("rp2"), 4);
});

test("Statement: IP", t => {
	const asm = compileProgram(function* (gs, ls) {
		yield new LIp(cExpr(1), cExpr(2), [
			cExpr(3),
			cExpr(~4),
			cExpr(~5),
			new VolatileExpression(new ConstantExpression(6))
		]);
	});
	t.deepEqual(
		asm.codeGen(new TextInstrSink()),
		TextInstrSink.rectify(`
			PUSHB_7 6 4 5 0 3 2 1
			SRP1
			SRP2
			IP
			PUSHB_1 2
			SLOOP
			SZP2
			IP
			DUP
			PUSHB_1 0
			LT
			IF
			NEG
			PUSHB_1 1
			SUB
			PUSHB_1 0
			SZP2
			ELSE
			PUSHB_1 1
			SZP2
			EIF
			IP`)
	);
	t.is(asm.getRegister("rp1"), 1);
	t.is(asm.getRegister("rp2"), 2);
});