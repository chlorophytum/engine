import {
	IFinalHintCollector,
	IFinalHintSession,
	IFontFormatPlugin,
	IHintingModelPlugin,
	IHintStore
} from "@chlorophytum/arch";
import { HlttCollector, HlttSession } from "@chlorophytum/final-hint-format-hltt";
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

	public async createFontSource(input: stream.Readable) {
		const otd = await StreamJson.parse(input);
		return new OtdFontSource(otd);
	}

	public async createHintStore(input: stream.Readable, plugins: IHintingModelPlugin[]) {
		const hs: IHintStore = new OpenTypeHintStore(this.hsSupport);
		await this.hsSupport.populateHintStore(input, plugins, hs);
		return hs;
	}

	public async saveFinalHint(
		col: IFinalHintCollector,
		fhs: IFinalHintSession,
		output: stream.Writable
	) {
		if (!(fhs instanceof HlttSession) || !(col instanceof HlttCollector)) {
			throw new TypeError("Type not supported");
		}
		const fpgm = [...col.getFunctionDefs(FontForgeTextInstr).values()].join("\n");
		const prep = fhs.getPreProgram(FontForgeTextInstr);
		const glyf: { [key: string]: string } = {};
		for (let gid of fhs.glyphPrograms.keys()) {
			glyf[gid] = fhs.getGlyphProgram(gid, FontForgeTextInstr);
		}

		const obj = { fpgm, prep, glyf };
		return stringifyJsonGz(obj, output);
	}

	public async integrateFinalHintsToFont(
		hints: stream.Readable,
		font: stream.Readable,
		output: stream.Writable
	): Promise<void> {
		const store = await parseJsonGz(hints);
		const otd = await StreamJson.parse(font);

		otd.fpgm = [store.fpgm];
		otd.prep = [store.prep];

		for (const gid in otd.glyf) {
			const hint = store.glyf[gid];
			if (hint !== undefined) otd.glyf[gid].instructions = [hint];
		}

		// Handle these metrics later
		otd.gasp = [
			{
				rangeMaxPPEM: 65535,
				dogray: true,
				gridfit: true,
				symmetric_smoothing: true,
				symmetric_gridfit: true
			}
		];
		otd.maxp.maxFunctionDefs = 2048;
		otd.maxp.maxStackElements = 2048;
		otd.maxp.maxStorage = 2048;
		otd.maxp.maxTwilightPoints = 256;
		otd.TSI_01 = otd.TSI_23 = otd.TSI5 = null;

		await StreamJson.stringify(otd, output);
	}
}

export const FontFormatPlugin: IFontFormatPlugin = new OtdFontFormatPlugin();
