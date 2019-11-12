import {
	IFinalHintCollector,
	IFinalHintPreStatAnalyzer,
	IFinalHintPreStatSink,
	IFinalHintSession,
	IFontFinalHintIntegrator,
	IFontFinalHintSaver,
	IFontFormatPlugin,
	Variation
} from "@chlorophytum/arch";
import {
	HlttCollector,
	HlttFinalHintStoreRep,
	HlttPreStatSink,
	HlttSession
} from "@chlorophytum/final-hint-format-hltt";
import { FontForgeTextInstr } from "@chlorophytum/fontforge-instr";
import { StreamJson, StreamJsonZip } from "@chlorophytum/util-json";
import * as fs from "fs";
import * as stream from "stream";

import { OtdFontSource } from "./simple-otd-support";

class OtdFontFormatPlugin implements IFontFormatPlugin {
	public async createFontSource(input: string, identifier: string) {
		const inputStream = fs.createReadStream(input);
		const otd = await StreamJson.parse(inputStream);
		return new OtdFontSource(otd, identifier);
	}

	public createPreStatAnalyzer(pss: IFinalHintPreStatSink) {
		const hlttPss = pss.dynamicCast(HlttPreStatSink);
		if (hlttPss) return new OtdHlttPreStatAnalyzer(hlttPss);
		else return null;
	}

	public createFinalHintSaver(collector: IFinalHintCollector) {
		const hlttCollector = collector.dynamicCast(HlttCollector);
		if (hlttCollector) return new OtdHlttFinalHintSaver(hlttCollector);
		else return null;
	}

	public createFinalHintIntegrator() {
		return new OtdTtInstrIntegrator();
	}
}

class OtdHlttPreStatAnalyzer implements IFinalHintPreStatAnalyzer {
	constructor(private readonly preStat: HlttPreStatSink) {}
	public async analyzeFontPreStat(font: stream.Readable) {
		const otd = await StreamJson.parse(font);
		if (!otd.maxp) return;
		this.preStat.maxFunctionDefs = Math.max(
			this.preStat.maxFunctionDefs,
			otd.maxp.maxFunctionDefs || 0
		);
		this.preStat.maxTwilightPoints = Math.max(
			this.preStat.maxTwilightPoints,
			otd.maxp.maxTwilightPoints || 0
		);
		this.preStat.maxStorage = Math.max(this.preStat.maxStorage, otd.maxp.maxStorage || 0);
		this.preStat.maxStack = Math.max(this.preStat.maxStack, otd.maxp.maxStack || 0);
		this.preStat.cvtSize = Math.max(this.preStat.cvtSize, otd.cvt_ ? otd.cvt_.length : 0);
	}
}

class OtdHlttFinalHintSaver implements IFontFinalHintSaver {
	constructor(private readonly collector: HlttCollector) {}
	private readonly instructionCache: Map<string, string> = new Map();
	public async saveFinalHint(fhs: IFinalHintSession, output: stream.Writable) {
		const hlttSession = fhs.dynamicCast(HlttSession);
		if (!hlttSession) throw new TypeError("Type not supported");

		const fhsRep: HlttFinalHintStoreRep<string> = this.createHintRep(hlttSession);
		return StreamJsonZip.stringify(fhsRep, output);
	}

	private createHintRep(fhs: HlttSession): HlttFinalHintStoreRep<string> {
		const fpgm = [...this.collector.getFunctionDefs(FontForgeTextInstr).values()];
		const prep = [fhs.getPreProgram(FontForgeTextInstr)];
		const cvt = this.collector.getControlValueDefs();
		const glyf: { [key: string]: string } = {};
		for (let gid of fhs.listGlyphNames()) {
			glyf[gid] = fhs.getGlyphProgram(gid, FontForgeTextInstr, this.instructionCache);
		}
		return { stats: this.collector.getStats(), fpgm, prep, glyf, cvt };
	}
}

class OtdTtInstrIntegrator implements IFontFinalHintIntegrator {
	public async integrateFinalHintsToFont(
		sHints: string,
		sFont: string,
		sOutput: string
	): Promise<void> {
		const instrStream = fs.createReadStream(sHints);
		const fontStream = fs.createReadStream(sFont);
		const outputStream = fs.createWriteStream(sOutput);

		const store: HlttFinalHintStoreRep<string> = await StreamJsonZip.parse(instrStream);
		const otd = await StreamJson.parse(fontStream);

		this.updateSharedInstructions(otd, store);
		this.updateCvt(otd, store);
		this.updateGlyphInstructions(otd, store);
		this.updateMaxp(otd, store);
		this.updateVtt(otd);

		await StreamJson.stringify(otd, outputStream);
	}
	public async integrateGlyphFinalHintsToFont(
		sHints: string,
		sFont: string,
		sOutput: string
	): Promise<void> {
		const instrStream = fs.createReadStream(sHints);
		const fontStream = fs.createReadStream(sFont);
		const outputStream = fs.createWriteStream(sOutput);

		const store: HlttFinalHintStoreRep<string> = await StreamJsonZip.parse(instrStream);
		const otdGlyphs = await StreamJson.parse(fontStream);
		this.updateGlyphInstructions(otdGlyphs, store);
		await StreamJson.stringify(otdGlyphs, outputStream);
	}

	private updateSharedInstructions(otd: any, store: HlttFinalHintStoreRep<string>) {
		otd.fpgm = [...(otd.fpgm || []), ...(store.fpgm || [])];
		otd.prep = [...(otd.prep || []), ...(store.prep || [])];
	}
	private updateGlyphInstructions(otd: any, store: HlttFinalHintStoreRep<string>) {
		for (const gid in otd.glyf) {
			const hint = store.glyf[gid];
			if (hint !== undefined) otd.glyf[gid].instructions = [hint];
		}
	}
	private updateMaxp(otd: any, store: HlttFinalHintStoreRep<string>) {
		if (!otd.maxp) otd.maxp = {};
		otd.maxp.maxZones = 2;
		otd.maxp.maxFunctionDefs = Math.min(
			0xffff,
			Math.max(otd.maxp.maxFunctionDefs || 0, store.stats.maxFunctionDefs || 0)
		);
		otd.maxp.maxStackElements = Math.min(
			0xffff,
			Math.max(otd.maxp.maxStackElements || 0, store.stats.stackHeight || 0)
		);
		otd.maxp.maxStorage = Math.min(
			0xffff,
			Math.max(otd.maxp.maxStorage || 0, store.stats.maxStorage || 0)
		);
		otd.maxp.maxTwilightPoints = Math.min(
			0xffff,
			Math.max(otd.maxp.maxTwilightPoints || 0, store.stats.maxTwilightPoints || 0)
		);
	}
	private getStaticCvtValue(val: Variation.Variance<number>) {
		let x = 0;
		for (const [master, delta] of val) if (!master) x += delta;
		return x;
	}
	private updateCvt(otd: any, store: HlttFinalHintStoreRep<string>) {
		if (!otd.cvt_) otd.cvt_ = [];
		const cvtMask: boolean[] = [];
		for (let j = 0; j < store.cvt.length; j++) {
			const item = store.cvt[j];
			if (!item) {
				cvtMask[j] = false;
			} else {
				otd.cvt_[j] = this.getStaticCvtValue(item);
				cvtMask[j] = true;
			}
		}
		otd.cvt_mask = cvtMask;
	}
	private updateVtt(otd: any) {
		otd.TSI_01 = otd.TSI_23 = otd.TSI5 = null;
	}
}
export const FontFormatPlugin: IFontFormatPlugin = new OtdFontFormatPlugin();
