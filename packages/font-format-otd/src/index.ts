/* eslint-disable @typescript-eslint/no-explicit-any */
import * as fs from "fs";

import {
	IFinalHintFormat,
	IFinalHintIntegrator,
	IFinalHintPreStatAnalyzer,
	IFinalHintSink,
	IFinalHintSinkSession,
	IFontConnection,
	IFontFormat,
	Plugins,
	Variation
} from "@chlorophytum/arch";
import {
	CHlttFinalHintFormat,
	HlttFinalHintStoreRep,
	HlttSession,
	HlttCollector
} from "@chlorophytum/final-hint-format-hltt";
import { FontForgeTextInstr } from "@chlorophytum/fontforge-instr";
import { StreamJson } from "@chlorophytum/util-json";

import { OtdFontSource } from "./simple-otd-support";

class OtdFontFormat implements IFontFormat {
	public async getFinalHintFormat(): Promise<IFinalHintFormat> {
		return new CHlttFinalHintFormat();
	}
	public async connectFont(path: string, identifier: string) {
		return new OtdFontConnection(path, identifier);
	}
}

class OtdFontConnection implements IFontConnection {
	constructor(private readonly path: string, private readonly identifier: string) {}

	public async openFontSource() {
		const inputStream = fs.createReadStream(this.path);
		const otd = await StreamJson.parse(inputStream);
		return new OtdFontSource(otd, this.identifier);
	}

	public async openPreStat(sink: IFinalHintSink) {
		const hlttSink = sink.dynamicCast(HlttCollector);
		if (hlttSink) return new OtdHlttPreStatAnalyzer(this.path, hlttSink);
		else return null;
	}

	public async openFinalHintIntegrator() {
		return new OtdHlttIntegrator(this.path);
	}
}

class OtdHlttPreStatAnalyzer implements IFinalHintPreStatAnalyzer {
	constructor(private readonly path: string, private readonly sink: HlttCollector) {}
	public async preStat() {
		const otd = await StreamJson.parse(fs.createReadStream(this.path));
		if (!otd.maxp) return;
		this.sink.preStatSink.maxFunctionDefs = Math.max(
			this.sink.preStatSink.maxFunctionDefs,
			otd.maxp.maxFunctionDefs || 0
		);
		this.sink.preStatSink.maxTwilightPoints = Math.max(
			this.sink.preStatSink.maxTwilightPoints,
			otd.maxp.maxTwilightPoints || 0
		);
		this.sink.preStatSink.maxStorage = Math.max(
			this.sink.preStatSink.maxStorage,
			otd.maxp.maxStorage || 0
		);
		this.sink.preStatSink.maxStack = Math.max(
			this.sink.preStatSink.maxStack,
			otd.maxp.maxStack || 0
		);
		this.sink.preStatSink.cvtSize = Math.max(
			this.sink.preStatSink.cvtSize,
			otd.cvt_ ? otd.cvt_.length : 0
		);
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

	async apply(collector: IFinalHintSink, session: IFinalHintSinkSession) {
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
		const glyf: { [key: string]: string } = {};
		for (const gid of fhs.listGlyphNames()) {
			glyf[gid] = fhs.getGlyphProgram(gid, FontForgeTextInstr, this.instructionCache);
		}
		const prep = [fhs.getPreProgram(FontForgeTextInstr)];
		const fpgm = [...col.getFunctionDefs(FontForgeTextInstr).values()];
		const cvt = col.getControlValueDefs();
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
