import { Assembler, TTI } from "@chlorophytum/hltt-next-backend";

import { ProgramScope } from "../scope";
import { Tr, TrExp } from "../tr";

export function pointRegisterNumber(point: TrExp) {
	const cPoint = point.isConstant();
	if (cPoint !== undefined) {
		return cPoint;
	} else {
		return undefined;
	}
}

export function setZone(asm: Assembler, zone: "zp0" | "zp1" | "zp2", twilight: boolean) {
	if (asm.getRegister(zone) !== (twilight ? 0 : 1)) {
		asm.intro(twilight ? 0 : 1);
		asm.prim(zoneSetInstr(zone), 1, 0);
		asm.setRegister(zone, twilight ? 0 : 1);
	}
}

function zoneSetInstr(zone: "zp0" | "zp1" | "zp2") {
	return zone === "zp0" ? TTI.SZP0 : zone === "zp1" ? TTI.SZP1 : TTI.SZP2;
}

function rpSetInstr(rpId: "rp0" | "rp1" | "rp2") {
	return rpId === "rp0" ? TTI.SRP0 : rpId === "rp1" ? TTI.SRP1 : TTI.SRP2;
}

export function addPointIndex(
	asm: Assembler,
	ps: ProgramScope,
	zone: "zp0" | "zp1" | "zp2",
	point: TrExp,
	fTwilight: boolean
) {
	point.compile(asm, ps);
	setZone(asm, zone, fTwilight);
}

export function setRpIfNeeded(
	asm: Assembler,
	ps: ProgramScope,
	zone: "zp0" | "zp1" | "zp2",
	rpId: "rp0" | "rp1" | "rp2",
	point: TrExp,
	twilight: boolean
) {
	const cPoint = point.isConstant();
	const omit = cPoint !== undefined && asm.getRegister(rpId) === cPoint;
	if (!omit) {
		point.compile(asm, ps);
		asm.prim(rpSetInstr(rpId), 1, 0);
		asm.setRegister(rpId, pointRegisterNumber(point));
	}
	setZone(asm, zone, twilight);
}
