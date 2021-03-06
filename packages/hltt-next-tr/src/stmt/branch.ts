import { Assembler, TTI } from "@chlorophytum/hltt-next-backend";

import { ProgramScope } from "../scope";
import { TrExp, TrStmt } from "../tr";

import { TrStmtBase } from "./base";

export class TrAlternative extends TrStmtBase {
	public constructor(private readonly parts: TrStmt[]) {
		super();
	}
	public willReturnAfter() {
		const last = this.parts[this.parts.length - 1];
		return last && last.willReturnAfter();
	}
	public compile(asm: Assembler, ps: ProgramScope) {
		const hBegin = asm.blockBegin();
		for (const part of this.parts) part.compile(asm, ps);
		asm.blockEnd(hBegin);
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
				asm.intro(asm.createLabelDifference(lBeforeBody, lAfterLoop));
				this.condition.compile(asm, ps);
				asm.blockBegin(lBeforeBody);
				asm.prim(TTI.JROF).deleted(2);
			}
			{
				this.consequent.compile(asm, ps);
				asm.intro(asm.createLabelDifference(lAfterBody, lBeforeLoop));
				asm.label(lAfterBody);
				asm.prim(TTI.JMPR).deleted(1);
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
				asm.intro(asm.createLabelDifference(lBeforeJump, lBeforeLoop));
				this.condition.compile(asm, ps);
				asm.blockBegin(lBeforeJump);
				asm.prim(TTI.JROT).deleted(2);
			}
		}
		asm.blockEnd(hBegin, lAfterLoop);
	}
}
