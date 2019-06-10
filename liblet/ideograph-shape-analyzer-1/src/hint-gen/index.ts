import { EmptyImpl, IHint } from "@chlorophytum/arch";
import { Interpolate, LinkChain, Smooth, WithDirection } from "@chlorophytum/hint-common";
import { EmBoxEdge, EmBoxInit, EmBoxStroke } from "@chlorophytum/hint-embox";
import { MultipleAlignZone } from "@chlorophytum/hint-maz";
import * as _ from "lodash";

import HierarchySink, { DependentHintType } from "../hierarchy/sink";
import { AdjPoint } from "../types/point";
import Stem from "../types/stem";

export default class HintGenSink extends HierarchySink {
	constructor(private readonly glyphKind: string) {
		super();
		this.preHints.push(new WithDirection.Hint(true, new EmBoxInit.Hint(this.glyphKind)));
		this.postHints.push(new Smooth.Hint());
	}
	private preHints: IHint[] = [];
	private subHints: IHint[] = [];
	private postHints: IHint[] = [];

	addBlue(top: boolean, z: AdjPoint) {
		this.subHints.push(new EmBoxEdge.Hint(this.glyphKind, top, z.id));
	}

	addInterpolate(rp1: number, rp2: number, z: number) {
		this.subHints.push(new Interpolate.Hint(rp1, rp2, [z]));
	}
	addLink(rp0: number, z: number) {
		this.subHints.push(new LinkChain.Hint([rp0, z]));
	}

	addBoundaryStem(stem: Stem, locTop: boolean, atBottom: boolean, atTop: boolean) {
		if (atBottom || atTop) {
			this.subHints.push(
				new EmBoxStroke.Hint(this.glyphKind, atTop, false, stem.lowKey.id, stem.highKey.id)
			);
		} else {
			this.subHints.push(
				new EmBoxStroke.Hint(this.glyphKind, locTop, true, stem.lowKey.id, stem.highKey.id)
			);
		}
	}
	addStemPileHint(
		bot: Stem,
		middle: Stem[],
		top: Stem,
		botIsBoundary: boolean,
		topIsBoundary: boolean,
		annex: number[]
	) {
		if (!middle.length) return;

		const botSame = bot === middle[0];
		const topSame = top === middle[middle.length - 1];
		const zBot = !bot ? -1 : botSame ? bot.lowKey.id : bot.highKey.id;
		const zTop = !top ? -1 : topSame ? top.highKey.id : top.lowKey.id;
		let inkMD: number[] = Array(middle.length).fill(1);
		let gapMD: number[] = Array(middle.length + 1).fill(1);

		// Fix gapMD
		if (botSame) gapMD[0] = 0;
		if (botIsBoundary || botSame) annex[0] = 0;

		if (topSame) gapMD[middle.length] = 0;
		if (topIsBoundary || topSame) annex[middle.length] = 0;

		this.subHints.push(
			new MultipleAlignZone.Hint({
				emBoxName: this.glyphKind,
				gapMinDist: gapMD,
				inkMinDist: inkMD,
				bottomFree: !botSame,
				topFree: !topSame,
				mergePriority: annex,
				bottomPoint: zBot,
				topPoint: zTop,
				middleStrokes: middle.map(s => [s.lowKey.id, s.highKey.id])
			})
		);
	}

	addDependentHint(type: DependentHintType, from: Stem, to: Stem) {
		this.subHints.push(new LinkChain.Hint([from.lowKey.id, to.lowKey.id]));
		this.subHints.push(new LinkChain.Hint([from.highKey.id, to.highKey.id]));
	}

	addStemEdgeAlign(stem: Stem) {
		if (stem.highAlign.length) {
			this.subHints.push(
				new LinkChain.Hint([stem.highKey.id, ...stem.highAlign.map(z => z.id)])
			);
		}
		if (stem.lowAlign.length) {
			this.subHints.push(
				new LinkChain.Hint([stem.lowKey.id, ...stem.lowAlign.map(z => z.id)])
			);
		}
	}

	getHint() {
		return new EmptyImpl.Sequence.Hint([
			...this.preHints,
			new WithDirection.Hint(true, new EmptyImpl.Sequence.Hint(this.subHints)),
			...this.postHints
		]);
	}
}
