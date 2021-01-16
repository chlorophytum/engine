import Assembler from "../../asm";
import { TTI } from "../../instr";
import { EdslProgramScope, Expression, PtrExpression, Statement, VkCvt } from "../interface";

import * as LongPoint from "./long-point";

export class LMdap extends Statement {
	constructor(private round: boolean, private readonly point: Expression) {
		super();
	}
	public compile(asm: Assembler, ps: EdslProgramScope) {
		if (this.point.getArity(ps) !== 1) throw new TypeError("Point Id arity mismatch.");
		LongPoint.addLongPointNumber(ps, asm, this.point, "zp0");
		asm.prim(this.round ? TTI.MDAP_rnd : TTI.MDAP_noRnd);
		asm.deleted(1);
		asm.setRegister("rp0", LongPoint.longPointRegisterNumber(this.point));
		asm.setRegister("rp1", LongPoint.longPointRegisterNumber(this.point));
	}
}

export class LMiap extends Statement {
	constructor(
		private round: boolean,
		private readonly point: Expression,
		private readonly pCV: PtrExpression<VkCvt>
	) {
		super();
	}
	public compile(asm: Assembler, ps: EdslProgramScope) {
		if (this.point.getArity(ps) !== 1) throw new TypeError("Point Id arity mismatch.");
		if (this.pCV.getArity(ps) !== 1) throw new TypeError("CVT Id arity mismatch.");
		LongPoint.addLongPointNumber(ps, asm, this.point, "zp0");
		this.pCV.compile(asm, ps);
		asm.prim(this.round ? TTI.MIAP_rnd : TTI.MIAP_noRnd);
		asm.deleted(2);
		asm.setRegister("rp0", LongPoint.longPointRegisterNumber(this.point));
		asm.setRegister("rp1", LongPoint.longPointRegisterNumber(this.point));
	}
}

function mrpMask(rp0: boolean, minDist: boolean, round: boolean, distanceMode: 0 | 1 | 2 | 3) {
	return distanceMode | (round ? 4 : 0) | (minDist ? 8 : 0) | (rp0 ? 16 : 0);
}

export class LMdrp extends Statement {
	constructor(
		private rp0: boolean,
		private minDist: boolean,
		private round: boolean,
		private distanceMode: 0 | 1 | 2 | 3,
		private readonly p0: Expression,
		private readonly point: Expression
	) {
		super();
	}

	public compile(asm: Assembler, ps: EdslProgramScope) {
		if (this.p0.getArity(ps) !== 1) throw new TypeError("Point Id arity mismatch.");
		if (this.point.getArity(ps) !== 1) throw new TypeError("Point Id arity mismatch.");
		const omitRP0 = LongPoint.addLongPointNumber(
			ps,
			asm,
			this.p0,
			"zp0",
			x => x === asm.getRegister("rp0")
		);
		if (!omitRP0) LongPoint.setRP(asm, "rp0", this.p0);

		LongPoint.addLongPointNumber(ps, asm, this.point, "zp1");

		asm.prim(TTI.MDRP_grey + mrpMask(this.rp0, this.minDist, this.round, this.distanceMode));
		asm.deleted(1);

		// Copy RP0 from RP1
		asm.setRegister("rp1", asm.getRegister("rp0"));
		// Set RP2 and RP0 (if so)
		asm.setRegister("rp2", LongPoint.longPointRegisterNumber(this.point));
		if (this.rp0) asm.setRegister("rp0", LongPoint.longPointRegisterNumber(this.point));
	}
}

export class LMirp extends Statement {
	constructor(
		private rp0: boolean,
		private minDist: boolean,
		private round: boolean,
		private distanceMode: 0 | 1 | 2 | 3,
		private readonly p0: Expression,
		private readonly point: Expression,
		private readonly pCV: PtrExpression<VkCvt>
	) {
		super();
	}

	public compile(asm: Assembler, ps: EdslProgramScope) {
		if (this.p0.getArity(ps) !== 1) throw new TypeError("Point Id arity mismatch.");
		if (this.point.getArity(ps) !== 1) throw new TypeError("Point Id arity mismatch.");
		if (this.pCV.getArity(ps) !== 1) throw new TypeError("CVT Id arity mismatch.");
		const omitRP0 = LongPoint.addLongPointNumber(
			ps,
			asm,
			this.p0,
			"zp0",
			x => x === asm.getRegister("rp0")
		);
		if (!omitRP0) LongPoint.setRP(asm, "rp0", this.p0);

		LongPoint.addLongPointNumber(ps, asm, this.point, "zp1");
		this.pCV.compile(asm, ps);

		asm.prim(TTI.MIRP_grey + mrpMask(this.rp0, this.minDist, this.round, this.distanceMode));
		asm.deleted(2);

		// Copy RP0 from RP1
		asm.setRegister("rp1", asm.getRegister("rp0"));
		// Set RP2 and RP0 (if so)
		asm.setRegister("rp2", LongPoint.longPointRegisterNumber(this.point));
		if (this.rp0) asm.setRegister("rp0", LongPoint.longPointRegisterNumber(this.point));
	}
}

export class LIp extends Statement {
	constructor(
		private readonly p1: Expression,
		private readonly p2: Expression,
		private readonly points: Expression[]
	) {
		super();
	}
	public compile(asm: Assembler, ps: EdslProgramScope) {
		if (this.p1.getArity(ps) !== 1) throw new TypeError("Point Id arity mismatch.");
		if (this.p2.getArity(ps) !== 1) throw new TypeError("Point Id arity mismatch.");
		for (const z of this.points) {
			if (z.getArity(ps) !== 1) throw new TypeError("Point Id arity mismatch.");
		}

		const omitRP1 = LongPoint.addLongPointNumber(
			ps,
			asm,
			this.p1,
			"zp0",
			x => x === asm.getRegister("rp1")
		);
		if (!omitRP1) LongPoint.setRP(asm, "rp1", this.p1);

		const omitRP2 = LongPoint.addLongPointNumber(
			ps,
			asm,
			this.p2,
			"zp1",
			x => x === asm.getRegister("rp2")
		);
		if (!omitRP2) LongPoint.setRP(asm, "rp2", this.p2);

		const run = new IpRun(ps, TTI.IP, asm);
		for (const z of this.points) run.intro(z);
		run.flushDecidable();
	}
}

class IpRun {
	constructor(
		private readonly ls: EdslProgramScope,
		readonly op: TTI,
		private readonly asm: Assembler
	) {}
	public arity = 0;
	public twilight = false;

	public flushDecidable() {
		if (!this.arity) return;
		this.setArity(this.arity);
		LongPoint.setZone(this.asm, "zp2", this.twilight);
		this.asm.prim(this.op, this.arity, 0);
		this.arity = 0;
	}

	public setArity(n: number) {
		if (n > 1) {
			this.asm.push(n).prim(TTI.SLOOP, 1, 0);
			this.asm.setRegister("loop", n);
		}
	}

	public intro(target: Expression) {
		const dt = LongPoint.decideTwilight(target);
		if (dt === undefined) {
			this.flushDecidable();
			LongPoint.addLongPointNumberUD(this.ls, this.asm, target, "zp2");
			this.setArity(1);
			this.asm.prim(this.op, 1, 0);
		} else {
			if (dt !== this.twilight) {
				this.flushDecidable();
				this.twilight = dt;
			}
			LongPoint.addLongPointNumberD(this.ls, this.asm, target);
			this.arity++;
		}
	}
}
