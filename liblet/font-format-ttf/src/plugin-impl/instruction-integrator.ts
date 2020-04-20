import { IFontFinalHintIntegrator } from "@chlorophytum/arch";
import { HlttFinalHintStoreRep } from "@chlorophytum/final-hint-format-hltt";
import { StreamJsonZip } from "@chlorophytum/util-json";
import * as fs from "fs-extra";
import { FontIo, Ot } from "ot-builder";

import { Base64Instr } from "../support/binary-instr";
import { GlyphSetWrapper, VarWrapper } from "../support/otb-support";

export class TtfInstrIntegrator implements IFontFinalHintIntegrator {
	public async integrateFinalHintsToFont(
		sHints: string,
		sFont: string,
		sOutput: string
	): Promise<void> {
		const store = await this.readInstrStore(sHints);
		const otd = await this.readFont(sFont);
		if (!Ot.Font.isTtf(otd)) return;

		this.updateSharedInstructions(otd, store);
		this.updateCvt(otd, store);
		this.updateGlyphInstructions(otd, store);
		this.updateMaxp(otd, store);

		await this.saveFont(otd, sOutput);
	}

	public async integrateGlyphFinalHintsToFont(
		sHints: string,
		sFont: string,
		sOutput: string
	): Promise<void> {
		const store = await this.readInstrStore(sHints);
		const otd = await this.readFont(sFont);
		if (!Ot.Font.isTtf(otd)) return;

		this.updateGlyphInstructions(otd, store);

		await this.saveFont(otd, sOutput);
	}

	private async readInstrStore(sHints: string) {
		const instrStream = fs.createReadStream(sHints);
		const store: HlttFinalHintStoreRep<string> = await StreamJsonZip.parse(instrStream);
		return store;
	}

	private async readFont(sFont: string) {
		const sfnt = FontIo.readSfntOtf(await fs.readFile(sFont));
		return FontIo.readFont(sfnt, Ot.ListGlyphStoreFactory);
	}
	private async saveFont(otd: Ot.Font, sOutput: string) {
		const sfntOut = FontIo.writeFont(otd, { glyphStore: { statOs2XAvgCharWidth: false } });
		await fs.writeFile(sOutput, FontIo.writeSfntOtf(sfntOut));
	}

	private updateSharedInstructions(otd: Ot.Font.Ttf, store: HlttFinalHintStoreRep<string>) {
		otd.fpgm = new Ot.Fpgm.Table(
			Buffer.concat([
				otd.fpgm ? otd.fpgm.instructions : Buffer.alloc(0),
				...store.fpgm.map(Base64Instr.decode)
			])
		);
		otd.prep = new Ot.Fpgm.Table(
			Buffer.concat([
				otd.prep ? otd.prep.instructions : Buffer.alloc(0),
				...store.prep.map(Base64Instr.decode)
			])
		);
	}
	private updateGlyphInstructions(otd: Ot.Font.Ttf, store: HlttFinalHintStoreRep<string>) {
		const glyphBimap = new GlyphSetWrapper(otd);
		for (const [gn, glyph] of glyphBimap) {
			const hint = store.glyf[gn];
			if (hint) glyph.hints = new Ot.Glyph.TtInstruction(Base64Instr.decode(hint));
		}
	}
	private updateMaxp(otd: Ot.Font.Ttf, store: HlttFinalHintStoreRep<string>) {
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

	private updateCvt(otd: Ot.Font.Ttf, store: HlttFinalHintStoreRep<string>) {
		const varWrapper = new VarWrapper(otd);
		const mc = Ot.Var.Create.ValueFactory();
		if (!otd.cvt) otd.cvt = new Ot.Cvt.Table();
		const cvtMask: boolean[] = [];
		for (let j = 0; j < store.cvt.length; j++) {
			const item = store.cvt[j];
			if (!item) {
				cvtMask[j] = false;
			} else {
				otd.cvt.items[j] = varWrapper.convertValue(mc, item);
				cvtMask[j] = true;
			}
		}
	}
}
