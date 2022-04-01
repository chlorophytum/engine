import { IFinalHintIntegrator, IFinalHintSink, IFinalHintSinkSession } from "@chlorophytum/arch";
import {
	HlttCollector,
	HlttFinalHintStoreRep,
	HlttSession
} from "@chlorophytum/final-hint-format-hltt";
import * as fs from "fs-extra";
import { FontIo, Ot, Tag } from "ot-builder";

import { BufferInstr, BufferWithRelocations } from "../support/buffer-instr";
import { GlyphSetWrapper, VarWrapper } from "../support/otb-support";

export class TtfInstrIntegrator implements IFinalHintIntegrator {
	constructor(private readonly sFont: string) {}

	private sfntSrc: null | Ot.Sfnt = null;
	private ttf: null | Ot.Font<Ot.ListGlyphStore> = null;
	private async ensureFontRead() {
		if (!this.sfntSrc) {
			this.sfntSrc = FontIo.readSfntOtf(await fs.readFile(this.sFont));
		}
		if (!this.ttf) {
			this.ttf = FontIo.readFont(this.sfntSrc, Ot.ListGlyphStoreFactory);
		}
	}

	public async save(output: string) {
		await this.ensureFontRead();
		if (!this.ttf) throw new Error("Invalid font format");
		if (!this.sfntSrc) throw new Error("Invalid font format");
		const sfntOut = FontIo.writeFont(this.ttf, {
			glyphStore: { statOs2XAvgCharWidth: false }
		});
		this.copyTable(sfntOut, this.sfntSrc, "maxp");
		this.copyTable(sfntOut, this.sfntSrc, "fpgm");
		this.copyTable(sfntOut, this.sfntSrc, "prep");
		this.copyTable(sfntOut, this.sfntSrc, "cvt ");
		this.copyTable(sfntOut, this.sfntSrc, "loca");
		this.copyTable(sfntOut, this.sfntSrc, "glyf");
		this.copyTable(sfntOut, this.sfntSrc, "head");
		await fs.writeFile(output, FontIo.writeSfntOtf(this.sfntSrc));
	}
	private copyTable(out: Ot.Sfnt, src: Ot.Sfnt, tag: Tag) {
		const tbl = out.tables.get(tag);
		if (tbl) src.tables.set(tag, tbl);
	}

	async apply(collector: IFinalHintSink, session: IFinalHintSinkSession) {
		const hlttCollector = collector.dynamicCast(HlttCollector);
		const hlttSession = session.dynamicCast(HlttSession);
		if (hlttCollector && hlttSession) {
			await this.ensureFontRead();
			if (!this.ttf || !Ot.Font.isTtf(this.ttf)) {
				throw new Error("Invalid font format");
			}
			const hrBytes = this.createHintRep(hlttCollector, hlttSession);

			this.updateSharedInstructions(this.ttf, hrBytes);
			this.updateCvt(this.ttf, hrBytes);
			this.updateGlyphInstructions(this.ttf, hrBytes);
			this.updateMaxp(this.ttf, hrBytes);
		} else {
			throw new TypeError("Final hint format not supported.");
		}
	}

	private readonly instructionCache: Map<string, BufferWithRelocations> = new Map();
	private createHintRep(
		col: HlttCollector,
		fhs: HlttSession
	): HlttFinalHintStoreRep<BufferWithRelocations> {
		const glyf: { [key: string]: BufferWithRelocations } = {};
		for (const gid of fhs.listGlyphNames()) {
			glyf[gid] = fhs.getGlyphProgram(gid, BufferInstr, this.instructionCache);
		}
		const prep = [fhs.getPreProgram(BufferInstr)];
		const fpgm = [...col.getFunctionDefs(BufferInstr).values()];
		const cvt = col.getControlValueDefs();
		return { stats: col.getStats(), fpgm, prep, glyf, cvt };
	}

	private updateSharedInstructions(
		ttf: Ot.Font.Ttf,
		hrBytes: HlttFinalHintStoreRep<BufferWithRelocations>
	) {
		const brFpgm = BufferWithRelocations.combine(ttf.fpgm?.instructions, hrBytes.fpgm);
		const brPrep = BufferWithRelocations.combine(ttf.prep?.instructions, hrBytes.prep);
		ttf.fpgm = new Ot.Fpgm.Table(brFpgm.buffer);
		ttf.prep = new Ot.Fpgm.Table(brPrep.buffer);
	}
	private updateGlyphInstructions(
		ttf: Ot.Font.Ttf,
		hrBytes: HlttFinalHintStoreRep<BufferWithRelocations>
	) {
		const glyphBimap = new GlyphSetWrapper(ttf);
		for (const [gn, glyph] of glyphBimap) {
			const hint = hrBytes.glyf[gn];
			if (!hint) continue;
			glyph.hints = new Ot.Glyph.TtInstruction(hint.buffer);
		}
	}
	private updateMaxp(ttf: Ot.Font.Ttf, hrBytes: HlttFinalHintStoreRep<BufferWithRelocations>) {
		ttf.maxp.maxZones = 2;
		ttf.maxp.maxFunctionDefs = Math.min(
			0xffff,
			Math.max(ttf.maxp.maxFunctionDefs || 0, hrBytes.stats.maxFunctionDefs || 0)
		);
		ttf.maxp.maxStackElements = Math.min(
			0xffff,
			Math.max(ttf.maxp.maxStackElements || 0, hrBytes.stats.stackHeight || 0)
		);
		ttf.maxp.maxStorage = Math.min(
			0xffff,
			Math.max(ttf.maxp.maxStorage || 0, hrBytes.stats.maxStorage || 0)
		);
		ttf.maxp.maxTwilightPoints = Math.min(
			0xffff,
			Math.max(ttf.maxp.maxTwilightPoints || 0, hrBytes.stats.maxTwilightPoints || 0)
		);
	}

	private updateCvt(ttf: Ot.Font.Ttf, hrBytes: HlttFinalHintStoreRep<BufferWithRelocations>) {
		const varWrapper = new VarWrapper(ttf);
		const mc = new Ot.Var.ValueFactory();

		if (!ttf.cvt) ttf.cvt = new Ot.Cvt.Table();
		const cvtMask: boolean[] = [];
		for (let j = 0; j < hrBytes.cvt.length; j++) {
			const item = hrBytes.cvt[j];
			if (!item) {
				cvtMask[j] = false;
			} else {
				ttf.cvt.items[j] = varWrapper.convertValue(mc, item);
				cvtMask[j] = true;
			}
		}
	}
}
