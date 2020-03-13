import { IFinalHintSession, IFontFinalHintSaver } from "@chlorophytum/arch";
import {
	HlttCollector,
	HlttFinalHintStoreRep,
	HlttSession
} from "@chlorophytum/final-hint-format-hltt";
import { StreamJsonZip } from "@chlorophytum/util-json";
import * as fs from "fs-extra";

import { Base64Instr } from "../support/binary-instr";

export class TtfFinalHintSaver implements IFontFinalHintSaver {
	constructor(private readonly collector: HlttCollector) {}
	private readonly instructionCache: Map<string, string> = new Map();
	public async saveFinalHint(fhs: IFinalHintSession, outputPath: string) {
		const output = fs.createWriteStream(outputPath);
		const hlttSession = fhs.dynamicCast(HlttSession);
		if (!hlttSession) throw new TypeError("Type not supported");

		const fhsRep: HlttFinalHintStoreRep<string> = this.createHintRep(hlttSession);
		return StreamJsonZip.stringify(fhsRep, output);
	}

	private createHintRep(fhs: HlttSession): HlttFinalHintStoreRep<string> {
		const fpgm = [...this.collector.getFunctionDefs(Base64Instr).values()];
		const prep = [fhs.getPreProgram(Base64Instr)];
		const cvt = this.collector.getControlValueDefs();
		const glyf: { [key: string]: string } = {};
		for (let gid of fhs.listGlyphNames()) {
			glyf[gid] = fhs.getGlyphProgram(gid, Base64Instr, this.instructionCache);
		}
		return { stats: this.collector.getStats(), fpgm, prep, glyf, cvt };
	}
}
