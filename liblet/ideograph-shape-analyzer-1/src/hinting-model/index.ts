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

function isIdeographCodePoint(code: number) {
	// return code === 0x2fd0;
	return (
		(code >= 0x2e80 && code <= 0x2fff) || // CJK radicals
		(code >= 0x3192 && code <= 0x319f) || // CJK strokes
		(code >= 0x3300 && code <= 0x9fff) || // BMP ideographs
		(code >= 0xf900 && code <= 0xfa6f) || // CJK compatibility ideographs
		(code >= 0xac00 && code <= 0xd7af) || // Hangul Syllables
		(code >= 0x20000 && code <= 0x3ffff) // SIP, TIP
	);
}

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
		for (const unicode of charSet) {
			if (!isIdeographCodePoint(unicode)) continue;
			const gid = await this.font.getEncodedGlyph(unicode);
			if (!gid) continue;
			gidSet.add(gid);
			const related = await this.font.getRelatedGlyphs(gid, unicode);
			if (!related) continue;
			for (const { target, relationTag } of related) {
				const selector = WellKnownGlyphRelation.UnicodeVariant.unApply(relationTag);
				if (selector) gidSet.add(target);
			}
		}
		return gidSet;
	}
	public async getGlyphCacheKey(gid: GID) {
		const geometry = await this.font.getGeometry(gid, null);
		if (!geometry) return null;
		const glyph = createGlyph(geometry.eigen); // Care about outline glyphs only
		return combineHash(JSON.stringify(this.params), hashGlyphContours(glyph));
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
	constructor(private readonly fmd: IFontSourceMetadata, ptParams: Partial<HintingStrategy>) {
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
