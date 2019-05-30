import { TTI } from "../../instr";
import Assembler from "../../ir";
import { ProgramScope } from "../../scope";
import { StdLib } from "../../stdlib/init-stdlib";
import { Expression, Variable } from "../interface";

export function zoneSetInstr(zone: "zp0" | "zp1" | "zp2") {
	return zone === "zp0" ? TTI.SZP0 : zone === "zp1" ? TTI.SZP1 : TTI.SZP2;
}

export function setZone(asm: Assembler, zone: "zp0" | "zp1" | "zp2", twilight: boolean) {
	if (asm.getRegister(zone) !== (twilight ? 0 : 1)) {
		asm.setRegister(zone, twilight ? 0 : 1);
		asm.intro(twilight ? 0 : 1)
			.prim(zoneSetInstr(zone))
			.deleted(1);
	}
}

export function setRP(asm: Assembler, zone: "rp0" | "rp1" | "rp2", point: Expression) {
	asm.prim(zone === "rp0" ? TTI.SRP0 : zone === "rp1" ? TTI.SRP1 : TTI.SRP2).deleted(1);
	asm.setRegister(zone, longPointRegisterNumber(point));
}

export function longPointRegisterNumber(point: Expression) {
	const cPoint = point.constant();
	if (cPoint !== undefined) {
		if (cPoint >= 0) {
			return cPoint;
		} else {
			return -cPoint - 1;
		}
	} else {
		return undefined;
	}
}

export function decideTwilight(point: Expression) {
	const cPoint = point.constant();
	if (cPoint !== undefined) {
		return cPoint < 0;
	} else {
		return undefined;
	}
}

export function addLongPointNumberD<V extends Variable>(
	ls: ProgramScope<V>,
	asm: Assembler,
	point: Expression
) {
	const cPoint = point.constant() || 0;
	if (cPoint >= 0) {
		asm.intro(cPoint);
	} else {
		const pPoint = -cPoint - 1;
		asm.intro(pPoint);
	}
}
export function addLongPointNumberUD<V extends Variable>(
	ls: ProgramScope<V>,
	asm: Assembler,
	point: Expression,
	zone: "zp0" | "zp1" | "zp2",
	omit?: (x: number) => boolean
) {
	point.compile(asm);
	StdLib.setZoneLp[zone].inline(ls.globals, asm);
	asm.forgetRegister(zone);
	return false;
}

export function addLongPointNumber<V extends Variable>(
	ls: ProgramScope<V>,
	asm: Assembler,
	point: Expression,
	zone: "zp0" | "zp1" | "zp2",
	omit?: (x: number) => boolean
) {
	const cPoint = point.constant();
	if (cPoint !== undefined) {
		let om = false;
		if (cPoint >= 0) {
			om = !!(omit && omit(cPoint));
			if (!om) asm.intro(cPoint);
		} else {
			const pPoint = -cPoint - 1;
			om = !!(omit && omit(pPoint));
			if (!om) asm.intro(pPoint);
		}
		setZone(asm, zone, cPoint < 0);
		return om;
	} else {
		point.compile(asm);
		StdLib.setZoneLp[zone].inline(ls.globals, asm);
		asm.forgetRegister(zone);
		return false;
	}
}
