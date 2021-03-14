import Assembler from "../../asm";
import { TTI } from "../../instr";
import { addPointIndex, pointRegisterNumber, setRpIfNeeded, setZone } from "../asm-util";
import { ProgramScope } from "../scope";
import { TrExp } from "../tr";

import { TrStmtBase } from "./base";

// Mdap : THandle -> Statement
export class TrMdap extends TrStmtBase {
	constructor(
		private round: boolean,
		private readonly point: TrExp,
		private readonly fTwilight: boolean
	) {
		super();
	}
	public compile(asm: Assembler, ps: ProgramScope) {
		this.point.compile(asm, ps);
		setZone(asm, "zp0", this.fTwilight);
		asm.prim(this.round ? TTI.MDAP_rnd : TTI.MDAP_noRnd, 1, 0);
		asm.setRegister("rp0", pointRegisterNumber(this.point));
		asm.setRegister("rp1", pointRegisterNumber(this.point));
	}
}

// Miap : THandle, Cvt(Frac) -> Statement
export class TrMiap extends TrStmtBase {
	constructor(
		private round: boolean,
		private readonly point: TrExp,
		private readonly fTwilight: boolean,
		private readonly pCV: TrExp
	) {
		super();
	}
	public compile(asm: Assembler, ps: ProgramScope) {
		addPointIndex(asm, ps, "zp0", this.point, this.fTwilight);
		this.pCV.compile(asm, ps);
		asm.prim(this.round ? TTI.MIAP_rnd : TTI.MIAP_noRnd, 2);
		asm.setRegister("rp0", pointRegisterNumber(this.point));
		asm.setRegister("rp1", pointRegisterNumber(this.point));
	}
}

function mrpMask(rp0: boolean, minDist: boolean, round: boolean, distanceMode: 0 | 1 | 2 | 3) {
	return distanceMode | (round ? 4 : 0) | (minDist ? 8 : 0) | (rp0 ? 16 : 0);
}

// Mdrp : THandle, THandle -> Statement
export class TrMdrp extends TrStmtBase {
	constructor(
		private rp0: boolean,
		private minDist: boolean,
		private round: boolean,
		private distanceMode: 0 | 1 | 2 | 3,
		private readonly p0: TrExp,
		private readonly p0Twilight: boolean,
		private readonly point: TrExp,
		private readonly pointTwilight: boolean
	) {
		super();
	}

	public compile(asm: Assembler, ps: ProgramScope) {
		setRpIfNeeded(asm, ps, "zp0", "rp0", this.p0, this.p0Twilight);
		addPointIndex(asm, ps, "zp1", this.point, this.pointTwilight);
		asm.prim(TTI.MDRP_grey + mrpMask(this.rp0, this.minDist, this.round, this.distanceMode), 1);

		// Copy RP0 from RP1
		asm.setRegister("rp1", asm.getRegister("rp0"));
		// Set RP2 and RP0 (if so)
		asm.setRegister("rp2", pointRegisterNumber(this.point));
		// Set RP0 if necessary
		if (this.rp0) asm.setRegister("rp0", pointRegisterNumber(this.point));
	}
}

// Mirp : THandle, THandle, Cvt(Frac) -> Statement
export class TrMirp extends TrStmtBase {
	constructor(
		private rp0: boolean,
		private minDist: boolean,
		private round: boolean,
		private distanceMode: 0 | 1 | 2 | 3,
		private readonly p0: TrExp,
		private readonly p0Twilight: boolean,
		private readonly point: TrExp,
		private readonly pointTwilight: boolean,
		private readonly pCV: TrExp
	) {
		super();
	}

	public compile(asm: Assembler, ps: ProgramScope) {
		setRpIfNeeded(asm, ps, "zp0", "rp0", this.p0, this.p0Twilight);
		addPointIndex(asm, ps, "zp1", this.point, this.pointTwilight);
		this.pCV.compile(asm, ps);

		asm.prim(TTI.MIRP_grey + mrpMask(this.rp0, this.minDist, this.round, this.distanceMode), 2);

		// Copy RP0 from RP1
		asm.setRegister("rp1", asm.getRegister("rp0"));
		// Set RP2 and RP0 (if so)
		asm.setRegister("rp2", pointRegisterNumber(this.point));
		// Set RP0 if necessary
		if (this.rp0) asm.setRegister("rp0", pointRegisterNumber(this.point));
	}
}

// IP : THandle, THandle, THandle... -> Statement
export class TrIp extends TrStmtBase {
	constructor(
		private readonly p1: TrExp,
		private readonly p1Twilight: boolean,
		private readonly p2: TrExp,
		private readonly p2Twilight: boolean,
		private readonly points: [TrExp, boolean][]
	) {
		super();
	}
	public compile(asm: Assembler, ps: ProgramScope) {
		setRpIfNeeded(asm, ps, "zp1", "rp1", this.p1, this.p1Twilight);
		setRpIfNeeded(asm, ps, "zp2", "rp2", this.p1, this.p2Twilight);

		const run = new IpRun(ps, TTI.IP, asm);
		for (const [z, tw] of this.points) run.intro(z, tw);
		run.flushDecidable();
	}
}

class IpRun {
	constructor(
		private readonly ps: ProgramScope,
		readonly op: TTI,
		private readonly asm: Assembler
	) {}
	public arity = 0;
	public twilight = false;

	public flushDecidable() {
		if (!this.arity) return;
		this.asm.intro(this.arity);
		setZone(this.asm, "zp0", this.twilight);
		this.asm.prim(this.op, this.arity + 1, 0);
		this.arity = 0;
	}

	public intro(target: TrExp, fTwilight: boolean) {
		if (fTwilight !== this.twilight || this.arity >= 32) {
			this.flushDecidable();
			this.twilight = fTwilight;
		}

		target.compile(this.asm, this.ps);
		this.arity++;
	}
}
