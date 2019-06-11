import { EmptyImpl, IFontSource, IHintingModel } from "@chlorophytum/arch";

import analyzeGlyph from "./analyze";
import { createGlyph } from "./create-glyph";
import HierarchyAnalyzer from "./hierarchy";
import HintGenSink from "./hint-gen";
import { createSharedHints } from "./shared-hints";
import { HintingStrategy } from "./strategy";

function isIdeographCodePoint(code: number) {
	return (
		(code >= 0x2e80 && code <= 0x2fff) || // CJK radicals
		(code >= 0x3192 && code <= 0x319f) || // CJK strokes
		(code >= 0x3300 && code <= 0x9fff) || // BMP ideographs
		(code >= 0xf900 && code <= 0xfa6f) || // CJK compatibility ideographs
		(code >= 0xac00 && code <= 0xd7af) || // Hangul Syllables
		(code >= 0x20000 && code <= 0x3ffff) // SIP, TIP
	);
}

export class IdeographHintingModel1<GID, VAR, MASTER> implements IHintingModel<GID> {
	constructor(
		private readonly font: IFontSource<GID, VAR, MASTER>,
		private readonly params: HintingStrategy
	) {}
	readonly type = "Chlorophytum::IdeographHintingModel1";

	analyzeSharedParameters() {
		const charSet = this.font.getCharacterSet();
		let gidSet: Set<GID> = new Set();
		for (const unicode of charSet) {
			if (!isIdeographCodePoint(unicode)) continue;
			const gid = this.font.getEncodedGlyph(unicode);
			if (gid) gidSet.add(gid);
		}
		return gidSet;
	}
	analyzeGlyph(gid: GID) {
		const geometry = this.font.getGeometry(gid, null);
		if (!geometry) return new EmptyImpl.Empty.Hint();

		const glyph = createGlyph(geometry.eigen); // Care about outline glyphs only

		const analysis = analyzeGlyph(glyph, this.params);
		const sink = new HintGenSink(this.params.groupName);
		const ha = new HierarchyAnalyzer(analysis, this.params);

		ha.pre(sink);
		do {
			ha.fetch(sink);
		} while (ha.lastPathWeight && ha.loops < 256);
		ha.post(sink);

		return sink.getHint();
	}
	getSharedHints() {
		return createSharedHints(this.params);
	}
}
