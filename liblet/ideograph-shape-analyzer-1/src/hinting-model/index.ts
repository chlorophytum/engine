import {
	EmptyImpl,
	Glyph,
	IFontSource,
	IFontSourceMetadata,
	IHintingModel,
	IParallelHintingModel,
	WellKnownGlyphRelation
} from "@chlorophytum/arch";

import { createSharedHints } from "../hint-gen/shared-hints";
import { createHintingStrategy, HintingStrategy } from "../strategy";
import { combineHash, hashGlyphContours } from "../types/hash";

import { createGlyph } from "./create-glyph";
import { hintGlyphGeometry } from "./glyph-hint-main";
import { isHangulCodePoint, isIdeographCodePoint } from "./unicode-kind";
import { ModelVersionPrefix } from "./version-prefix";

export class IdeographHintingModel1<GID> implements IHintingModel<GID> {
	private readonly params: HintingStrategy;
	constructor(private readonly font: IFontSource<GID>, ptParams: Partial<HintingStrategy>) {
		this.params = createHintingStrategy(font.metadata.upm, ptParams);
	}
	public readonly type = "Chlorophytum::IdeographHintingModel1";
	public readonly allowParallel = true;

	public async analyzeEffectiveGlyphs() {
		const charSet = await this.font.getCharacterSet();
		let gidSet: Set<GID> = new Set();
		for (const ch of charSet) await this.analyzeEffectiveGlyphsForChar(gidSet, ch);
		return gidSet;
	}
	private async analyzeEffectiveGlyphsForChar(gidSet: Set<GID>, ch: number) {
		if (!this.unicodeAcceptable(ch)) return;
		const gid = await this.font.getEncodedGlyph(ch);
		if (!gid) return;
		gidSet.add(gid);
		const related = await this.font.getRelatedGlyphs(gid, ch);
		if (!related) return;
		for (const { target, relationTag } of related) {
			const selector = WellKnownGlyphRelation.UnicodeVariant.unApply(relationTag);
			if (selector) gidSet.add(target);
		}
	}
	private unicodeAcceptable(code: number) {
		if (isIdeographCodePoint(code) && !this.params.ignoreIdeographs) return true;
		if (isHangulCodePoint(code) && !this.params.ignoreHangul) return true;
		return false;
	}

	public async getGlyphCacheKey(gid: GID) {
		const geometry = await this.font.getGeometry(gid, null);
		if (!geometry) return null;
		const glyph = createGlyph(geometry.eigen); // Care about outline glyphs only
		return combineHash(
			ModelVersionPrefix,
			JSON.stringify(this.params),
			hashGlyphContours(glyph)
		);
	}
	public async analyzeGlyph(gid: GID) {
		const geometry = await this.font.getGeometry(gid, null);
		if (!geometry) return new EmptyImpl.Empty.Hint();
		return hintGlyphGeometry(geometry, this.params);
	}
	public async getSharedHints() {
		return createSharedHints(this.params);
	}
}

export class IdeographParallelHintingModel1 implements IParallelHintingModel {
	public readonly type = "Chlorophytum::IdeographHintingModel1";
	constructor(fmd: IFontSourceMetadata, ptParams: Partial<HintingStrategy>) {
		this.params = createHintingStrategy(fmd.upm, ptParams);
	}
	private readonly params: HintingStrategy;
	public async analyzeGlyph(rep: Glyph.Rep) {
		const shapeMap = new Map(rep.shapes);
		const geometry = shapeMap.get(null);
		if (!geometry) return new EmptyImpl.Empty.Hint();
		return hintGlyphGeometry(geometry, this.params);
	}
}
