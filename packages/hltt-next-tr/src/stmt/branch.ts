import { Assembler, TTI } from "@chlorophytum/hltt-next-backend";

import { ProgramScope } from "../scope";
import { TrExp, TrStmt } from "../tr";

import { TrStmtBase } from "./base";
import { TrSeq } from "./sequence";

export class TrAlternative extends TrSeq {
	public constructor(parts: TrStmt[]) {
		super(true, parts);
	}
}

export class TrIf extends TrStmtBase {
	constructor(
		private readonly condition: TrExp,
		public readonly consequent?: null | undefined | TrAlternative,
		public readonly alternate?: null | undefined | TrAlternative
	) {
		super();
	}
	public willReturnAfter() {
		return !!(
			this.consequent &&
			this.alternate &&
			this.consequent.willReturnAfter() &&
			this.alternate.willReturnAfter()
		);
	}
	public compile(asm: Assembler, ps: ProgramScope) {
		const hBegin = asm.blockBegin();
		this.condition.compile(asm, ps);
		asm.prim(TTI.IF).deleted(1);
		if (this.consequent) {
			this.consequent.compile(asm, ps);
		}
		if (this.alternate) {
			asm.prim(TTI.ELSE);
			this.alternate.compile(asm, ps);
		}
		asm.prim(TTI.EIF);
		asm.blockEnd(hBegin);
	}
}

export class TrWhile extends TrStmtBase {
	constructor(private readonly condition: TrExp, private readonly consequent: TrAlternative) {
		super();
	}
	public compile(asm: Assembler, ps: ProgramScope) {
		const lBeforeLoop = asm.createLabel();
		const lBeforeBody = asm.createLabel();
		const lAfterBody = asm.createLabel();
		const lAfterLoop = asm.createLabel();

		const hBegin = asm.blockBegin(lBeforeLoop);
		{
			{
				const diff = asm.createLabelDifference(lBeforeBody, lAfterLoop);
				asm.intro(diff);
				this.condition.compile(asm, ps);
				asm.label(lBeforeBody);
				asm.jumpPrim(TTI.JROF, diff).deleted(2);
			}
			{
				this.consequent.compile(asm, ps);
				const diff = asm.createLabelDifference(lAfterBody, lBeforeLoop);
				asm.intro(diff);
				asm.label(lAfterBody);
				asm.jumpPrim(TTI.JMPR, diff).deleted(1);
			}
		}
		asm.blockEnd(hBegin, lAfterLoop);
	}
}

export class TrDoWhile extends TrStmtBase {
	constructor(private readonly consequent: TrAlternative, private readonly condition: TrExp) {
		super();
	}
	public compile(asm: Assembler, ps: ProgramScope) {
		const lBeforeLoop = asm.createLabel();
		const lAfterLoop = asm.createLabel();

		const hBegin = asm.blockBegin(lBeforeLoop);
		{
			{
				this.consequent.compile(asm, ps);
			}
			{
				const lBeforeJump = asm.createLabel();
				const diff = asm.createLabelDifference(lBeforeJump, lBeforeLoop);
				asm.intro(diff);
				this.condition.compile(asm, ps);
				asm.label(lBeforeJump);
				asm.jumpPrim(TTI.JROT, diff).deleted(2);
			}
		}
		asm.blockEnd(hBegin, lAfterLoop);
	}
}
