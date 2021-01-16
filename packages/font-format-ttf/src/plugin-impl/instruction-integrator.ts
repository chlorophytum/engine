import { IFinalHintCollector, IFinalHintIntegrator, IFinalHintSession } from "@chlorophytum/arch";
import {
	HlttCollector,
	HlttFinalHintStoreRep,
	HlttSession
} from "@chlorophytum/final-hint-format-hltt";
import * as fs from "fs-extra";
import { FontIo, Ot } from "ot-builder";

import { BufferInstr } from "../support/buffer-instr";
import { GlyphSetWrapper, VarWrapper } from "../support/otb-support";

export class TtfInstrIntegrator implements IFinalHintIntegrator {
	constructor(private readonly sFont: string) {}

	private ttf: null | Ot.Font<Ot.ListGlyphStore> = null;
	private async ensureFontRead() {
		if (!this.ttf) {
			const sfnt = FontIo.readSfntOtf(await fs.readFile(this.sFont));
			this.ttf = FontIo.readFont(sfnt, Ot.ListGlyphStoreFactory);
		}
	}

	public async save(output: string) {
		await this.ensureFontRead();
		if (!this.ttf) throw new Error("Invalid font format");
		await this.saveFont(this.ttf, output);
	}
	private async saveFont(otd: Ot.Font, sOutput: string) {
		const sfntOut = FontIo.writeFont(otd, {
			glyphStore: { statOs2XAvgCharWidth: false }
		});
		await fs.writeFile(sOutput, FontIo.writeSfntOtf(sfntOut));
	}

	async apply(collector: IFinalHintCollector, session: IFinalHintSession) {
		const hlttCollector = collector.dynamicCast(HlttCollector);
		const hlttSession = session.dynamicCast(HlttSession);
		if (hlttCollector && hlttSession) {
			await this.ensureFontRead();
			if (!this.ttf || !Ot.Font.isTtf(this.ttf)) {
				throw new Error("Invalid font format");
			}
			const store = this.createHintRep(hlttCollector, hlttSession);
			this.updateSharedInstructions(this.ttf, store);
			this.updateCvt(this.ttf, store);
			this.updateGlyphInstructions(this.ttf, store);
			this.updateMaxp(this.ttf, store);
		} else {
			throw new TypeError("Final hint format not supported.");
		}
	}

	private readonly instructionCache: Map<string, Buffer> = new Map();
	private createHintRep(col: HlttCollector, fhs: HlttSession): HlttFinalHintStoreRep<Buffer> {
		const fpgm = [...col.getFunctionDefs(BufferInstr).values()];
		const prep = [fhs.getPreProgram(BufferInstr)];
		const cvt = col.getControlValueDefs();
		const glyf: { [key: string]: Buffer } = {};
		for (const gid of fhs.listGlyphNames()) {
			glyf[gid] = fhs.getGlyphProgram(gid, BufferInstr, this.instructionCache);
		}
		return { stats: col.getStats(), fpgm, prep, glyf, cvt };
	}

	private updateSharedInstructions(ttf: Ot.Font.Ttf, store: HlttFinalHintStoreRep<Buffer>) {
		ttf.fpgm = new Ot.Fpgm.Table(
			Buffer.concat([ttf.fpgm ? ttf.fpgm.instructions : Buffer.alloc(0), ...store.fpgm])
		);
		ttf.prep = new Ot.Fpgm.Table(
			Buffer.concat([ttf.prep ? ttf.prep.instructions : Buffer.alloc(0), ...store.prep])
		);
	}
	private updateGlyphInstructions(ttf: Ot.Font.Ttf, store: HlttFinalHintStoreRep<Buffer>) {
		const glyphBimap = new GlyphSetWrapper(ttf);
		for (const [gn, glyph] of glyphBimap) {
			const hint = store.glyf[gn];
			if (hint) glyph.hints = new Ot.Glyph.TtInstruction(hint);
		}
	}
	private updateMaxp(ttf: Ot.Font.Ttf, store: HlttFinalHintStoreRep<Buffer>) {
		ttf.maxp.maxZones = 2;
		ttf.maxp.maxFunctionDefs = Math.min(
			0xffff,
			Math.max(ttf.maxp.maxFunctionDefs || 0, store.stats.maxFunctionDefs || 0)
		);
		ttf.maxp.maxStackElements = Math.min(
			0xffff,
			Math.max(ttf.maxp.maxStackElements || 0, store.stats.stackHeight || 0)
		);
		ttf.maxp.maxStorage = Math.min(
			0xffff,
			Math.max(ttf.maxp.maxStorage || 0, store.stats.maxStorage || 0)
		);
		ttf.maxp.maxTwilightPoints = Math.min(
			0xffff,
			Math.max(ttf.maxp.maxTwilightPoints || 0, store.stats.maxTwilightPoints || 0)
		);
	}

	private updateCvt(ttf: Ot.Font.Ttf, store: HlttFinalHintStoreRep<Buffer>) {
		const varWrapper = new VarWrapper(ttf);
		const mc = new Ot.Var.ValueFactory();
		if (!ttf.cvt) ttf.cvt = new Ot.Cvt.Table();
		const cvtMask: boolean[] = [];
		for (let j = 0; j < store.cvt.length; j++) {
			const item = store.cvt[j];
			if (!item) {
				cvtMask[j] = false;
			} else {
				ttf.cvt.items[j] = varWrapper.convertValue(mc, item);
				cvtMask[j] = true;
			}
		}
	}
}
