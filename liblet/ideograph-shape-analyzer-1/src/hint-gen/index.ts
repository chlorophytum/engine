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

	public addBlue(top: boolean, z: AdjPoint) {
		this.subHints.push(new EmBoxEdge.Hint(this.glyphKind, top, z.id));
	}

	public addInterpolate(rp1: number, rp2: number, z: number) {
		this.subHints.push(new Interpolate.Hint(rp1, rp2, [z]));
	}
	public addLink(rp0: number, z: number) {
		this.subHints.push(new LinkChain.Hint([rp0, z]));
	}

	public addBoundaryStem(stem: Stem, locTop: boolean, atBottom: boolean, atTop: boolean) {
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
	public addStemPileHint(
		bot: null | Stem,
		middle: Stem[],
		top: null | Stem,
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

		const allowCollide = annex.map(a => !!a);

		// Fix gapMD
		if (botSame) gapMD[0] = 0;
		if (botIsBoundary || botSame) allowCollide[0] = false;

		if (topSame) gapMD[middle.length] = 0;
		if (topIsBoundary || topSame) allowCollide[middle.length] = false;

		this.subHints.push(
			new MultipleAlignZone.Hint({
				emBoxName: this.glyphKind,
				gapMinDist: gapMD,
				inkMinDist: inkMD,
				bottomFree: !botSame,
				topFree: !topSame,
				mergePriority: annex,
				allowCollide,
				bottomPoint: zBot,
				topPoint: zTop,
				middleStrokes: middle.map(s => [s.lowKey.id, s.highKey.id])
			})
		);
	}

	public addDependentHint(
		type: DependentHintType,
		belowFrom: null | Stem,
		from: Stem,
		aboveFrom: null | Stem,
		to: Stem
	) {
		if (type === DependentHintType.DiagHighToLow && belowFrom) {
			this.subHints.push(
				new MultipleAlignZone.Hint({
					emBoxName: this.glyphKind,
					gapMinDist: [1, 0],
					inkMinDist: [1],
					bottomFree: false,
					topFree: false,
					mergePriority: [0, 1],
					allowCollide: [false, true],
					bottomPoint: belowFrom.highKey.id,
					middleStrokes: [[to.lowKey.id, to.highKey.id]],
					topPoint: from.highKey.id
				})
			);
		} else if (type === DependentHintType.DiagLowToHigh && aboveFrom) {
			this.subHints.push(
				new MultipleAlignZone.Hint({
					emBoxName: this.glyphKind,
					gapMinDist: [0, 1],
					inkMinDist: [1],
					bottomFree: false,
					topFree: false,
					mergePriority: [-1, 0],
					allowCollide: [true, false],
					bottomPoint: from.lowKey.id,
					middleStrokes: [[to.lowKey.id, to.highKey.id]],
					topPoint: aboveFrom.lowKey.id
				})
			);
		} else {
			this.subHints.push(new LinkChain.Hint([from.lowKey.id, to.lowKey.id]));
			this.subHints.push(new LinkChain.Hint([from.highKey.id, to.highKey.id]));
		}
	}

	public addStemEdgeAlign(stem: Stem) {
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

	public getHint() {
		return new EmptyImpl.Sequence.Hint([
			...this.preHints,
			new WithDirection.Hint(true, new EmptyImpl.Sequence.Hint(this.subHints)),
			...this.postHints
		]);
	}
}
