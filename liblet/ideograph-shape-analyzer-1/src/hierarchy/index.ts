import { GlyphAnalysis } from "../analyze/analysis";
import { atGlyphBottom, atGlyphTop } from "../si-common/stem-spatial";
import HintingStrategy from "../strategy";
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

export default class HierarchyAnalyzer {
	private stemPointMask: number[];
	lastPathWeight = 0;
	loops = 0;

	constructor(private analysis: GlyphAnalysis, private readonly strategy: HintingStrategy) {
		this.stemPointMask = [];
		for (let j = 0; j < analysis.stems.length; j++) this.stemPointMask[j] = MaskState.Available;
	}

	pre(sink: HierarchySink) {
		for (const z of this.analysis.blueZone.topZs) sink.addBlue(true, z);
		for (const z of this.analysis.blueZone.bottomZs) sink.addBlue(false, z);
	}

	fetch(sink: HierarchySink) {
		this.loops++;

		let path = this.getKeyPath();
		let dependents = this.getDependents(path);
		const top = path[0];
		const bot = path[path.length - 1];
		if (!this.analysis.stems[bot] || !this.analysis.stems[top]) return;
		const middle = path.filter(j => this.analysis.stems[j] && !this.stemPointMask[j]).reverse();
		if (!middle.length) return;

		if (!this.stemPointMask[bot]) {
			this.stemPointMask[bot] = MaskState.Hinted;
			sink.addBoundaryStem(
				this.analysis.stems[bot],
				false,
				atGlyphBottom(this.analysis.stems[bot], this.strategy),
				atGlyphTop(this.analysis.stems[bot], this.strategy)
			);
		}
		if (!this.stemPointMask[top]) {
			this.stemPointMask[top] = MaskState.Hinted;
			sink.addBoundaryStem(
				this.analysis.stems[top],
				true,
				atGlyphBottom(this.analysis.stems[top], this.strategy),
				atGlyphTop(this.analysis.stems[top], this.strategy)
			);
		}
		sink.addStemHint(
			this.analysis.stems[bot],
			middle.map(j => this.analysis.stems[j]),
			this.analysis.stems[top],
			this.getMergePriority(this.analysis.collisionMatrices.annexation, top, bot, middle)
		);
		for (const dependent of dependents) {
			sink.addDependentHint(
				dependent.type,
				this.analysis.stems[dependent.fromStem],
				this.analysis.stems[dependent.toStem]
			);
		}

		for (const j of path) this.stemPointMask[j] = MaskState.Hinted;
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

	post(sink: HierarchySink) {
		for (let j = 0; j < this.analysis.stems.length; j++) {
			if (!this.stemPointMask[j]) {
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
		mergeS: [number, number, number][],
		priMulS: number[]
	) {
		const sj = this.analysis.stems[j];
		const sk = this.analysis.stems[k];
		const merge = m[j][k];
		const priMul =
			j === k || m[j][k] >= this.strategy.DEADLY_MERGE
				? 0
				: sj.xMin >= sk.xMin && sj.xMax <= sk.xMax
				? -1
				: 1;
		mergeS.push([merge, index, 0]);
		priMulS.push(priMul);
	}

	private getMergePriority(m: number[][], top: number, bot: number, middle: number[]) {
		let merge: [number, number, number][] = [];
		let priMul: number[] = [];
		this.getMergePairData(m, middle[0], bot, 0, merge, priMul);
		for (let j = 1; j < middle.length; j++) {
			this.getMergePairData(m, middle[j], middle[j - 1], j, merge, priMul);
		}
		this.getMergePairData(m, top, middle[middle.length - 1], middle.length, merge, priMul);
		merge.sort((a, b) => b[0] - a[0]);
		for (let j = 0; j < merge.length; j++) {
			merge[j][2] = 1 + j;
		}
		merge.sort((a, b) => a[1] - b[1]);
		return merge.map((x, j) => x[2] * priMul[j]);
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
		return path;
	}

	private getDependents(path: number[]) {
		let dependents: DependentHint[] = [];

		for (const j of path) {
			if (this.stemPointMask[j]) continue;
			for (let k = 0; k < this.analysis.stems.length; k++) {
				if (this.stemPointMask[k] || k === j) continue;
				if (
					this.analysis.stems[j].rid &&
					this.analysis.stems[j].rid === this.analysis.stems[k].rid
				) {
					if (this.analysis.stems[j].diagLow && this.analysis.stems[k].diagHigh) {
						this.stemPointMask[k] = MaskState.Dependent;
						dependents.push({
							type: DependentHintType.DiagLowToHigh,
							fromStem: j,
							toStem: k
						});
						continue;
					}
					if (this.analysis.stems[j].diagHigh && this.analysis.stems[k].diagLow) {
						this.stemPointMask[k] = MaskState.Dependent;
						dependents.push({
							type: DependentHintType.DiagHighToLow,
							fromStem: j,
							toStem: k
						});
						continue;
					}
				}
				if (this.analysis.symmetry[j][k] || this.analysis.symmetry[k][j]) {
					this.stemPointMask[k] = MaskState.Dependent;
					dependents.push({ type: DependentHintType.Symmetry, fromStem: j, toStem: k });
					continue;
				}
			}
		}
		return dependents;
	}
}
