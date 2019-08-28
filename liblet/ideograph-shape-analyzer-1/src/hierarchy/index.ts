import * as _ from "lodash";

import { GlyphAnalysis } from "../analyze/analysis";
import { atGlyphBottom, atGlyphTop } from "../si-common/stem-spatial";
import { HintingStrategy } from "../strategy";
import Stem from "../types/stem";

import HierarchySink, { DependentHintType } from "./sink";

interface LpRec {
	weight: number;
	next: number;
}
function LP(g: boolean[][], w: number[][], j: number, cache: (LpRec | null)[]): LpRec {
	if (cache[j]) return cache[j]!;
	let c: LpRec = {
		weight: 0,
		next: -1
	};
	for (let k = j; k-- > 0; ) {
		if (!g[j][k]) continue;
		const ck = LP(g, w, k, cache);
		const w1 = ck.weight + w[j][k];
		if (w1 > c.weight) {
			c.weight = w1;
			c.next = k;
		}
	}
	cache[j] = c;
	return c;
}

enum MaskState {
	Available = 0,
	Dependent = 1,
	Hinted = 2
}

interface DependentHint {
	type: DependentHintType;
	fromStem: number;
	toStem: number;
}

interface MergeDecideGap {
	index: number;
	sidAbove: number;
	sidBelow: number;
	multiplier: number;
	order: number;
	merged: boolean;
}

export default class HierarchyAnalyzer {
	private stemMask: number[];
	public lastPathWeight = 0;
	public loops = 0;

	constructor(private analysis: GlyphAnalysis, private readonly strategy: HintingStrategy) {
		this.stemMask = [];
		for (let j = 0; j < analysis.stems.length; j++) this.stemMask[j] = MaskState.Available;
	}

	public pre(sink: HierarchySink) {
		for (const z of this.analysis.blueZone.topZs) sink.addBlue(true, z);
		for (const z of this.analysis.blueZone.bottomZs) sink.addBlue(false, z);
		for (const z of this.analysis.nonBlueTopBottom.topZs) sink.addBlue(true, z);
		for (const z of this.analysis.nonBlueTopBottom.bottomZs) sink.addBlue(false, z);
	}

	public fetch(sink: HierarchySink) {
		this.loops++;

		let path = this.getKeyPath();
		let dependents = this.getDependents(path);
		const top = path[0];
		const bot = path[path.length - 1];
		if (!this.analysis.stems[bot] || !this.analysis.stems[top]) return;

		const sidPile = path.filter(j => this.analysis.stems[j] && !this.stemMask[j]).reverse();
		if (!sidPile.length) return;

		let botIsBoundary = false,
			botAtGlyphBottom = false,
			topIsBoundary = false,
			topAtGlyphTop = false;
		if (!this.stemMask[bot]) {
			this.stemMask[bot] = MaskState.Hinted;
			botAtGlyphBottom = atGlyphBottom(this.analysis.stems[bot], this.strategy);
			sink.addBoundaryStem(
				this.analysis.stems[bot],
				false,
				botAtGlyphBottom,
				atGlyphTop(this.analysis.stems[bot], this.strategy)
			);
			botIsBoundary = true;
		}
		if (!this.stemMask[top]) {
			this.stemMask[top] = MaskState.Hinted;
			topAtGlyphTop = atGlyphTop(this.analysis.stems[top], this.strategy);
			sink.addBoundaryStem(
				this.analysis.stems[top],
				true,
				atGlyphBottom(this.analysis.stems[top], this.strategy),
				topAtGlyphTop
			);
			topIsBoundary = true;
		}

		const sidPileMiddle = sidPile.filter(j => {
			if (!botAtGlyphBottom && j === bot) return false;
			if (!topAtGlyphTop && j === top) return false;
			return true;
		});

		if (sidPileMiddle.length) {
			sink.addStemPileHint(
				this.analysis.stems[bot],
				sidPileMiddle.map(j => this.analysis.stems[j]),
				this.analysis.stems[top],
				botIsBoundary,
				topIsBoundary,
				this.getMergePriority(
					this.analysis.collisionMatrices.annexation,
					top,
					bot,
					sidPileMiddle
				),
				this.getMinGap(this.analysis.collisionMatrices.flips, top, bot, sidPileMiddle)
			);
		} else if (botIsBoundary && !topIsBoundary && !botAtGlyphBottom) {
			sink.addBottomSemiBoundaryStem(this.analysis.stems[bot], this.analysis.stems[top]);
		} else if (topIsBoundary && !topAtGlyphTop && !botIsBoundary) {
			sink.addTopSemiBoundaryStem(this.analysis.stems[top], this.analysis.stems[bot]);
		}

		for (const dependent of dependents) {
			sink.addDependentHint(
				dependent.type,
				this.getStemBelow(bot, sidPile, top, dependent.fromStem),
				this.analysis.stems[dependent.fromStem],
				this.getStemAbove(bot, sidPile, top, dependent.fromStem),
				this.analysis.stems[dependent.toStem]
			);
		}

		for (const j of path) this.stemMask[j] = MaskState.Hinted;
	}

	private getStemBelow(bot: number, middle: number[], top: number, j: number): Stem | null {
		const c = [bot, ...middle, top];
		const jj = c.indexOf(j);
		if (jj > 0) return this.analysis.stems[c[jj - 1]];
		else return null;
	}
	private getStemAbove(bot: number, middle: number[], top: number, j: number): Stem | null {
		const c = [bot, ...middle, top];
		const jj = c.lastIndexOf(j);
		if (jj >= 0 && jj < c.length - 1) return this.analysis.stems[c[jj + 1]];
		else return null;
	}

	private collectIpSaCalls(sink: HierarchySink) {
		let a: number[][] = [];
		for (const ip of this.analysis.interpolations) {
			a.push([ip.priority, ip.rp1.id, ip.rp2.id, ip.z.id]);
		}
		for (const ip of this.analysis.shortAbsorptions) {
			a.push([ip.priority, ip.rp0.id, ip.z.id]);
		}
		a.sort((p, q) => q[0] - p[0]);
		for (const x of a) {
			if (x.length > 3) {
				sink.addInterpolate(x[1], x[2], x[3]);
			} else {
				sink.addLink(x[1], x[2]);
			}
		}
	}

	public post(sink: HierarchySink) {
		for (let j = 0; j < this.analysis.stems.length; j++) {
			if (!this.stemMask[j]) {
				sink.addBoundaryStem(
					this.analysis.stems[j],
					!this.analysis.stems[j].hasGlyphStemAbove,
					atGlyphBottom(this.analysis.stems[j], this.strategy),
					atGlyphTop(this.analysis.stems[j], this.strategy)
				);
			}
		}
		for (const stem of this.analysis.stems) {
			sink.addStemEdgeAlign(stem);
		}
		this.collectIpSaCalls(sink);
	}

	private getMergePairData(
		m: number[][],
		j: number,
		k: number,
		index: number,
		gaps: MergeDecideGap[]
	) {
		const sj = this.analysis.stems[j];
		const sk = this.analysis.stems[k];
		const multiplier =
			j === k || m[j][k] >= this.strategy.DEADLY_MERGE
				? 0
				: sj.xMin >= sk.xMin && sj.xMax <= sk.xMax
				? -1
				: 1;
		gaps.push({ index, sidAbove: j, sidBelow: k, multiplier, order: 0, merged: false });
	}

	private optimizeMergeGaps(m: number[][], gaps: MergeDecideGap[]) {
		let n = 1 + gaps.length;
		for (;;) {
			let mergeGapId = -1;
			let minCost = this.strategy.DEADLY_MERGE;
			for (let j = 0; j < gaps.length; j++) {
				const gap = gaps[j];
				if (!gap.multiplier || gap.merged) continue;
				gap.merged = true; // pretend we are merged
				let jMin = j,
					jMax = j;
				while (jMin >= 0 && gaps[jMin].merged) jMin--;
				while (jMax < gaps.length && gaps[jMax].merged) jMax++;

				let cost = 0;
				for (let p = jMin + 1; p < jMax; p++) {
					for (let q = jMin + 1; q <= p; q++) {
						cost += m[gaps[p].sidAbove][gaps[q].sidBelow];
					}
				}

				if (cost < minCost) {
					minCost = cost;
					mergeGapId = j;
				}

				gap.merged = false;
			}
			if (mergeGapId >= 0) {
				gaps[mergeGapId].order = n;
				gaps[mergeGapId].merged = true;
				n--;
			} else {
				return;
			}
		}
	}

	private getMergePriority(m: number[][], top: number, bot: number, middle: number[]) {
		let gaps: MergeDecideGap[] = [];
		this.getMergePairData(m, middle[0], bot, 0, gaps);
		for (let j = 1; j < middle.length; j++) {
			this.getMergePairData(m, middle[j], middle[j - 1], j, gaps);
		}
		this.getMergePairData(m, top, middle[middle.length - 1], middle.length, gaps);
		this.optimizeMergeGaps(m, gaps);
		return gaps.map(x => x.order * x.multiplier);
	}

	private getMinGapData(f: number[][], j: number, k: number, gaps: number[]) {
		gaps.push(f[j][k] > 1 || f[k][j] > 1 ? 1 : 0);
	}
	private getMinGap(f: number[][], top: number, bot: number, middle: number[]) {
		let gaps: number[] = [];
		this.getMinGapData(f, middle[0], bot, gaps);
		for (let j = 1; j < middle.length; j++) {
			this.getMinGapData(f, middle[j], middle[j - 1], gaps);
		}
		this.getMinGapData(f, top, middle[middle.length - 1], gaps);
		return gaps;
	}

	private getKeyPath() {
		this.lastPathWeight = 0;
		let pathStart = -1;
		let lpCache: (LpRec | null)[] = [];
		for (let j = 0; j < this.analysis.stems.length; j++) {
			LP(this.analysis.directOverlaps, this.analysis.stemOverlapLengths, j, lpCache);
		}
		for (let j = 0; j < this.analysis.stems.length; j++) {
			if (lpCache[j]!.weight > this.lastPathWeight) {
				this.lastPathWeight = lpCache[j]!.weight;
				pathStart = j;
			}
		}
		let path: number[] = [];
		while (pathStart >= 0) {
			path.push(pathStart);
			const next = lpCache[pathStart]!.next;
			if (pathStart >= 0 && next >= 0) this.analysis.directOverlaps[pathStart][next] = false;
			pathStart = next;
		}
		for (let m = 0; m < path.length; m++) {
			const sm = this.analysis.stems[path[m]];
			if (!sm || !sm.rid) continue;
			if ((!sm.hasGlyphStemBelow && sm.diagHigh) || (!sm.hasGlyphStemAbove && sm.diagLow)) {
				// Our key path is on a strange track
				// We selected a diagonal stroke half, but it is not a good half
				// Try to swap. 2 parts of a diagonal never occur in a path, so swapping is ok.
				let opposite = -1;
				for (let j = 0; j < this.analysis.stems.length; j++) {
					if (j !== path[m] && this.analysis.stems[j].rid === sm.rid) opposite = j;
				}
				if (opposite >= 0 && !this.stemMask[opposite]) path[m] = opposite;
			}
		}
		return _.uniq(path);
	}

	private getDependents(path: number[]) {
		let dependents: DependentHint[] = [];

		for (const j of path) {
			if (this.stemMask[j]) continue;
			for (let k = 0; k < this.analysis.stems.length; k++) {
				if (this.stemMask[k] || k === j) continue;
				if (
					this.analysis.stems[j].rid &&
					this.analysis.stems[j].rid === this.analysis.stems[k].rid
				) {
					if (this.analysis.stems[j].diagLow && this.analysis.stems[k].diagHigh) {
						this.stemMask[k] = MaskState.Dependent;
						dependents.push({
							type: DependentHintType.DiagLowToHigh,
							fromStem: j,
							toStem: k
						});
						continue;
					}
					if (this.analysis.stems[j].diagHigh && this.analysis.stems[k].diagLow) {
						this.stemMask[k] = MaskState.Dependent;
						dependents.push({
							type: DependentHintType.DiagHighToLow,
							fromStem: j,
							toStem: k
						});
						continue;
					}
				}
				if (this.analysis.symmetry[j][k] || this.analysis.symmetry[k][j]) {
					this.stemMask[k] = MaskState.Dependent;
					dependents.push({ type: DependentHintType.Symmetry, fromStem: j, toStem: k });
					continue;
				}
			}
		}
		return dependents;
	}
}
