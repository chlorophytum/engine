import { IFinalHintIntegrator, IFinalHintSink, IFinalHintSinkSession } from "@chlorophytum/arch";
import {
	HlttFinalHintStoreRep,
	HlttSession,
	HlttCollector
} from "@chlorophytum/final-hint-format-hltt";
import * as fs from "fs-extra";
import { FontIo, Ot, Tag } from "ot-builder";

import { BufferInstr } from "../support/buffer-instr";
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
		const glyf: { [key: string]: Buffer } = {};
		for (const gid of fhs.listGlyphNames()) {
			glyf[gid] = fhs.getGlyphProgram(gid, BufferInstr, this.instructionCache);
		}
		const prep = [fhs.getPreProgram(BufferInstr)];
		const fpgm = [...col.getFunctionDefs(BufferInstr).values()];
		const cvt = col.getControlValueDefs();
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
