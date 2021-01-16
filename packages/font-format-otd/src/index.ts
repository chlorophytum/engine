/* eslint-disable @typescript-eslint/no-explicit-any */
import * as fs from "fs";

import {
	IFinalHintCollector,
	IFinalHintFormat,
	IFinalHintIntegrator,
	IFinalHintPreStatAnalyzer,
	IFinalHintPreStatSink,
	IFinalHintSession,
	IFinalHintSessionConnection,
	IFontFormat,
	Plugins,
	Variation
} from "@chlorophytum/arch";
import {
	CHlttFinalHintFormat,
	HlttCollector,
	HlttFinalHintStoreRep,
	HlttPreStatSink,
	HlttSession
} from "@chlorophytum/final-hint-format-hltt";
import { FontForgeTextInstr } from "@chlorophytum/fontforge-instr";
import { StreamJson } from "@chlorophytum/util-json";

import { OtdFontSource } from "./simple-otd-support";

class OtdFontFormat implements IFontFormat {
	public async loadFont(path: string, identifier: string) {
		const inputStream = fs.createReadStream(path);
		const otd = await StreamJson.parse(inputStream);
		return new OtdFontSource(otd, identifier);
	}

	public async createPreStatAnalyzer(pss: IFinalHintPreStatSink) {
		const hlttPss = pss.dynamicCast(HlttPreStatSink);
		if (hlttPss) return new OtdHlttPreStatAnalyzer(hlttPss);
		else return null;
	}

	public async createFinalHintSessionConnection(collector: IFinalHintCollector) {
		const hlttCollector = collector.dynamicCast(HlttCollector);
		if (hlttCollector) return new OtdHlttHintSessionConnection(hlttCollector);
		else return null;
	}
	public async createFinalHintIntegrator(fontPath: string) {
		return new OtdHlttIntegrator(fontPath);
	}
	public async getFinalHintFormat(): Promise<IFinalHintFormat> {
		return new CHlttFinalHintFormat();
	}
}

class OtdHlttHintSessionConnection implements IFinalHintSessionConnection {
	constructor(private readonly collector: HlttCollector) {}
	public async connectFont(path: string): Promise<IFinalHintSession> {
		return this.collector.createSession();
	}
}

class OtdHlttPreStatAnalyzer implements IFinalHintPreStatAnalyzer {
	constructor(private readonly preStat: HlttPreStatSink) {}
	public async analyzeFontPreStat(font: string) {
		const otd = await StreamJson.parse(fs.createReadStream(font));
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

class OtdHlttIntegrator implements IFinalHintIntegrator {
	constructor(private readonly sFont: string) {}
	private otd: any = null;

	private async readFont() {
		if (!this.otd) {
			const fontStream = fs.createReadStream(this.sFont);
			this.otd = await StreamJson.parse(fontStream);
		}
	}

	async apply(collector: IFinalHintCollector, session: IFinalHintSession) {
		const hlttCollector = collector.dynamicCast(HlttCollector);
		const hlttSession = session.dynamicCast(HlttSession);
		if (hlttCollector && hlttSession) {
			await this.readFont();
			const store = this.createHintRep(hlttCollector, hlttSession);
			this.updateSharedInstructions(this.otd, store);
			this.updateCvt(this.otd, store);
			this.updateGlyphInstructions(this.otd, store);
			this.updateMaxp(this.otd, store);
		} else {
			throw new TypeError("Final hint format not supported.");
		}
	}

	async save(output: string) {
		await this.readFont();
		const outputStream = fs.createWriteStream(output);
		await StreamJson.stringify(this.otd, outputStream);
	}

	private readonly instructionCache: Map<string, string> = new Map();
	private createHintRep(col: HlttCollector, fhs: HlttSession): HlttFinalHintStoreRep<string> {
		const fpgm = [...col.getFunctionDefs(FontForgeTextInstr).values()];
		const prep = [fhs.getPreProgram(FontForgeTextInstr)];
		const cvt = col.getControlValueDefs();
		const glyf: { [key: string]: string } = {};
		for (const gid of fhs.listGlyphNames()) {
			glyf[gid] = fhs.getGlyphProgram(gid, FontForgeTextInstr, this.instructionCache);
		}
		return { stats: col.getStats(), fpgm, prep, glyf, cvt };
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
}

export const FontFormatPlugin: Plugins.IFontFormatPlugin = {
	load: async () => new OtdFontFormat()
};
