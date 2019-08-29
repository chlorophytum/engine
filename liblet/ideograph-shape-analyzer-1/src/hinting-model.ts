import {
	EmptyImpl,
	GlyphRep,
	GlyphShape,
	IFontSource,
	IFontSourceMetadata,
	IHintingModel,
	IHintingModelPlugin,
	IParallelHintingModel
} from "@chlorophytum/arch";
import { Interpolate, LinkChain, Smooth, WithDirection } from "@chlorophytum/hint-common";
import { EmBoxEdge, EmBoxInit, EmBoxShared, EmBoxStroke } from "@chlorophytum/hint-embox";
import { MultipleAlignZone } from "@chlorophytum/hint-maz";

import analyzeGlyph from "./analyze";
import { createGlyph } from "./create-glyph";
import HierarchyAnalyzer from "./hierarchy";
import HintGenSink from "./hint-gen";
import { createSharedHints } from "./shared-hints";
import { createHintingStrategy, HintingStrategy } from "./strategy";

function hintGlyphGeometry(geometry: GlyphShape, params: HintingStrategy) {
	const glyph = createGlyph(geometry.eigen); // Care about outline glyphs only
	const analysis = analyzeGlyph(glyph, params);
	const sink = new HintGenSink(params.groupName);
	const ha = new HierarchyAnalyzer(analysis, params);
	ha.pre(sink);
	do {
		ha.fetch(sink);
	} while (ha.lastPathWeight && ha.loops < 256);
	ha.post(sink);
	return sink.getHint();
}

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

class IdeographHintingModel1<GID, VAR, MASTER> implements IHintingModel<GID> {
	private readonly params: HintingStrategy;
	constructor(
		private readonly font: IFontSource<GID, VAR, MASTER>,
		ptParams: Partial<HintingStrategy>
	) {
		this.params = createHintingStrategy(ptParams);
	}
	public readonly type = "Chlorophytum::IdeographHintingModel1";
	public readonly allowParallel = true;

	public async analyzeEffectiveGlyphs() {
		const charSet = await this.font.getCharacterSet();
		let gidSet: Set<GID> = new Set();
		for (const unicode of charSet) {
			if (!isIdeographCodePoint(unicode)) continue;
			const gid = await this.font.getEncodedGlyph(unicode);
			if (gid) gidSet.add(gid);
		}
		return gidSet;
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

class IdeographParallelHintingModel1<VAR, MASTER> implements IParallelHintingModel<VAR, MASTER> {
	public readonly type = "Chlorophytum::IdeographHintingModel1";
	constructor(private readonly fmd: IFontSourceMetadata, ptParams: Partial<HintingStrategy>) {
		this.params = createHintingStrategy(ptParams);
	}
	private readonly params: HintingStrategy;
	public async analyzeGlyph(rep: GlyphRep<VAR, MASTER>) {
		const shapeMap = new Map(rep.shapes);
		const geometry = shapeMap.get(null);
		if (!geometry) return new EmptyImpl.Empty.Hint();
		return hintGlyphGeometry(geometry, this.params);
	}
}

class CIdeographHintingModelFactory1 implements IHintingModelPlugin {
	public readonly type = "Chlorophytum::IdeographHintingModel1";
	public adopt<GID, VAR, MASTER>(
		font: IFontSource<GID, VAR, MASTER>,
		parameters: any
	): IHintingModel<GID> | null | undefined {
		return new IdeographHintingModel1<GID, VAR, MASTER>(font, parameters);
	}
	public adoptParallel(metadata: IFontSourceMetadata, parameters: any) {
		return new IdeographParallelHintingModel1(metadata, parameters);
	}
	public readonly hintFactories = [
		new WithDirection.HintFactory(),
		new MultipleAlignZone.HintFactory(),
		new LinkChain.HintFactory(),
		new Interpolate.HintFactory(),
		new EmBoxStroke.HintFactory(),
		new EmBoxEdge.HintFactory(),
		new EmBoxInit.HintFactory(),
		new EmBoxShared.HintFactory(),
		new Smooth.HintFactory()
	];
}

const IdeographHintingModelFactory1: IHintingModelPlugin = new CIdeographHintingModelFactory1();

export default IdeographHintingModelFactory1;
