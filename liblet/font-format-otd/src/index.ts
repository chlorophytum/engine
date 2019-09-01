import {
	IFinalHintCollector,
	IFinalHintPreStatAnalyzer,
	IFinalHintPreStatSink,
	IFinalHintSession,
	IFontFinalHintIntegrator,
	IFontFinalHintSaver,
	IFontFormatPlugin,
	IHintingModelPlugin,
	IHintStore
} from "@chlorophytum/arch";
import {
	HlttCollector,
	HlttFinalHintStoreRep,
	HlttPreStatSink,
	HlttSession
} from "@chlorophytum/final-hint-format-hltt";
import { OpenTypeHintStore } from "@chlorophytum/font-opentype";
import { FontForgeTextInstr } from "@chlorophytum/fontforge-instr";
import { StreamJson } from "@chlorophytum/util-json";
import * as stream from "stream";
import * as zlib from "zlib";

import { OtdFontSource, OtdHsSupport } from "./simple-otd-support";

function stringifyJsonGz(obj: any, output: stream.Writable): Promise<void> {
	const ts = new stream.PassThrough();
	ts.pipe(zlib.createGzip()).pipe(output);
	return new Promise<void>(resolve => {
		StreamJson.stringify(obj, ts);
		output.on("close", () => resolve());
	});
}

async function parseJsonGz(input: stream.Readable) {
	const ts = new stream.PassThrough();
	input.pipe(zlib.createGunzip()).pipe(ts);
	return await StreamJson.parse(ts);
}

class OtdFontFormatPlugin implements IFontFormatPlugin {
	private readonly hsSupport = new OtdHsSupport();

	public async createFontSource(input: stream.Readable, identifier: string) {
		const otd = await StreamJson.parse(input);
		return new OtdFontSource(otd, identifier);
	}

	public async createHintStore(input: stream.Readable, plugins: IHintingModelPlugin[]) {
		const hs: IHintStore = new OpenTypeHintStore(this.hsSupport);
		await this.hsSupport.populateHintStore(input, plugins, hs);
		return hs;
	}
	public createPreStatAnalyzer(pss: IFinalHintPreStatSink) {
		if (pss instanceof HlttPreStatSink) return new OtdHlttPreStatAnalyzer(pss);
		else return null;
	}

	public createFinalHintSaver(collector: IFinalHintCollector) {
		if (collector instanceof HlttCollector) return new OtdHlttFinalHintSaver(collector);
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
	}
}

class OtdHlttFinalHintSaver implements IFontFinalHintSaver {
	constructor(private readonly collector: HlttCollector) {}
	private readonly instructionCache: Map<string, string> = new Map();
	public async saveFinalHint(fhs: IFinalHintSession, output: stream.Writable) {
		if (!(fhs instanceof HlttSession) || !(this.collector instanceof HlttCollector)) {
			throw new TypeError("Type not supported");
		}
		const fhsRep: HlttFinalHintStoreRep<string> = this.createHintRep(fhs);
		return stringifyJsonGz(fhsRep, output);
	}

	private createHintRep(fhs: HlttSession): HlttFinalHintStoreRep<string> {
		const fpgm = [...this.collector.getFunctionDefs(FontForgeTextInstr).values()];
		const prep = [fhs.getPreProgram(FontForgeTextInstr)];
		const glyf: { [key: string]: string } = {};
		for (let gid of fhs.listGlyphNames()) {
			glyf[gid] = fhs.getGlyphProgram(gid, FontForgeTextInstr, this.instructionCache);
		}
		return { stats: this.collector.getStats(), fpgm, prep, glyf };
	}
}

class OtdTtInstrIntegrator implements IFontFinalHintIntegrator {
	public async integrateFinalHintsToFont(
		hints: stream.Readable,
		font: stream.Readable,
		output: stream.Writable
	): Promise<void> {
		const store: HlttFinalHintStoreRep<string> = await parseJsonGz(hints);
		const otd = await StreamJson.parse(font);

		this.updateInstructions(otd, store);
		this.updateGasp(otd);
		this.updateMaxp(otd, store);
		this.updateVtt(otd);

		await StreamJson.stringify(otd, output);
	}

	private updateInstructions(otd: any, store: HlttFinalHintStoreRep<string>) {
		otd.fpgm = [...(otd.fpgm || []), ...(store.fpgm || [])];
		otd.prep = [...(otd.prep || []), ...(store.prep || [])];
		for (const gid in otd.glyf) {
			const hint = store.glyf[gid];
			if (hint !== undefined) otd.glyf[gid].instructions = [hint];
		}
	}

	private updateGasp(otd: any) {
		otd.gasp = [
			{
				rangeMaxPPEM: 65535,
				dogray: true,
				gridfit: true,
				symmetric_smoothing: true,
				symmetric_gridfit: true
			}
		];
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

	private updateVtt(otd: any) {
		otd.TSI_01 = otd.TSI_23 = otd.TSI5 = null;
	}
}
export const FontFormatPlugin: IFontFormatPlugin = new OtdFontFormatPlugin();
