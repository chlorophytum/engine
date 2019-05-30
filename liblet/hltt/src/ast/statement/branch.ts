import { TTI } from "../../instr";
import Assembler from "../../ir";
import { cExpr } from "../expression/constant";
import { Expression, Statement } from "../interface";

export class AlternativeStatement extends Statement {
	private readonly parts: Statement[];
	constructor(_parts: Iterable<Statement>) {
		super();
		this.parts = [..._parts];
	}
	refer(asm: Assembler) {
		for (const part of this.parts) part.refer(asm);
	}
	willReturnAfter() {
		const last = this.parts[this.parts.length - 1];
		return last && last.willReturnAfter();
	}
	compile(asm: Assembler) {
		const hBegin = asm.blockBegin();
		for (const part of this.parts) part.compile(asm);
		asm.blockEnd(hBegin);
	}
}

export class IfStatement extends Statement {
	private readonly condition: Expression;
	constructor(
		_condition: number | Expression,
		public readonly consequent: AlternativeStatement,
		public readonly alternate?: null | undefined | AlternativeStatement
	) {
		super();
		this.condition = cExpr(_condition);
	}
	refer(asm: Assembler) {
		this.condition.refer(asm);
		this.consequent.refer(asm);
		if (this.alternate) this.alternate.refer(asm);
	}
	willReturnAfter() {
		return !!(
			this.consequent &&
			this.alternate &&
			this.consequent.willReturnAfter() &&
			this.alternate.willReturnAfter()
		);
	}
	compile(asm: Assembler) {
		const hBegin = asm.blockBegin();
		this.condition.compile(asm);
		asm.prim(TTI.IF).deleted(1);
		this.consequent.compile(asm);
		if (this.alternate) {
			asm.prim(TTI.ELSE);
			this.alternate.compile(asm);
		}
		asm.prim(TTI.EIF);
		asm.blockEnd(hBegin);
	}
}

export class WhileStatement extends Statement {
	private readonly condition: Expression;
	constructor(
		_condition: number | Expression,
		private readonly consequent: AlternativeStatement
	) {
		super();
		this.condition = cExpr(_condition);
	}
	refer(asm: Assembler) {
		this.condition.refer(asm);
		this.consequent.refer(asm);
	}
	compile(asm: Assembler) {
		const lBeforeLoop = asm.createLabel();
		const lBeforeBody = asm.createLabel();
		const lAfterBody = asm.createLabel();
		const lAfterLoop = asm.createLabel();

		const hBegin = asm.blockBegin(lBeforeLoop);
		{
			{
				asm.intro(asm.createLabelDifference(lBeforeBody, lAfterLoop));
				this.condition.compile(asm);
				asm.blockBegin(lBeforeBody);
				asm.prim(TTI.JROF).deleted(2);
			}
			{
				this.consequent.compile(asm);
				asm.intro(asm.createLabelDifference(lAfterBody, lBeforeLoop));
				asm.label(lAfterBody);
				asm.prim(TTI.JMPR).deleted(1);
			}
		}
		asm.blockEnd(hBegin, lAfterLoop);
	}
}

export class DoWhileStatement extends Statement {
	private readonly condition: Expression;
	constructor(
		private readonly consequent: AlternativeStatement,
		_condition: number | Expression
	) {
		super();
		this.condition = cExpr(_condition);
	}
	refer(asm: Assembler) {
		this.condition.refer(asm);
		this.consequent.refer(asm);
	}
	compile(asm: Assembler) {
		const lBeforeLoop = asm.createLabel();
		const lAfterLoop = asm.createLabel();

		const hBegin = asm.blockBegin(lBeforeLoop);
		{
			{
				this.consequent.compile(asm);
			}
			{
				const lBeforeJump = asm.createLabel();
				asm.intro(asm.createLabelDifference(lBeforeJump, lBeforeLoop));
				this.condition.compile(asm);
				asm.blockBegin(lBeforeJump);
				asm.prim(TTI.JROT).deleted(2);
			}
		}
		asm.blockEnd(hBegin, lAfterLoop);
	}
}