import { IFinalHintPreStatAnalyzer } from "@chlorophytum/arch";
import { HlttPreStatSink } from "@chlorophytum/final-hint-format-hltt";
import * as fs from "fs-extra";
import { FontIo, Ot } from "ot-builder";

export class TtfPreStatAnalyzer implements IFinalHintPreStatAnalyzer {
	constructor(private readonly preStat: HlttPreStatSink) {}
	public async analyzeFontPreStat(sFont: string) {
		const sfnt = FontIo.readSfntOtf(await fs.readFile(sFont));
		const otd = FontIo.readFont(sfnt, Ot.ListGlyphStoreFactory);
		if (!Ot.Font.isTtf(otd)) return;
		this.preStat.maxFunctionDefs = Math.max(
			this.preStat.maxFunctionDefs,
			otd.maxp.maxFunctionDefs || 0
		);
		this.preStat.maxTwilightPoints = Math.max(
			this.preStat.maxTwilightPoints,
			otd.maxp.maxTwilightPoints || 0
		);
		this.preStat.maxStorage = Math.max(this.preStat.maxStorage, otd.maxp.maxStorage || 0);
		this.preStat.maxStack = Math.max(this.preStat.maxStack, otd.maxp.maxStackElements || 0);
		this.preStat.cvtSize = Math.max(this.preStat.cvtSize, otd.cvt ? otd.cvt.items.length : 0);
	}
}
