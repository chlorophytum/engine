import * as _ from "lodash";

import { AdjPoint } from "../types/point";
import Stem from "../types/stem";

export enum DependentHintType {
	Symmetry,
	DiagLowToHigh,
	DiagHighToLow
}
export default class HierarchySink {
	addInterpolate(rp1: number, rp2: number, z: number) {}
	addLink(rp0: number, z: number) {}
	addBlue(top: boolean, z: AdjPoint) {}
	addBoundaryStem(stem: Stem, locTop: boolean, atBottom: boolean, atTop: boolean) {}
	addStemHint(bot: Stem, middle: Stem[], top: Stem, annex: number[]) {}
	addDependentHint(type: DependentHintType, from: Stem, to: Stem) {}
	addStemEdgeAlign(stem: Stem) {}
}

export class LogSink extends HierarchySink {
	addBoundaryStem(stem: Stem, locTop: boolean, atBottom: boolean, atTop: boolean) {
		console.log("BOUND", [stem.lowKey.id, stem.highKey.id], atBottom, atTop);
	}
	addStemHint(bot: Stem, middle: Stem[], top: Stem, annex: number[]) {
		console.log(
			"STEMS",
			bot === middle[0] ? bot.lowKey.id : bot.highKey.id,
			_.flatten(middle.map(s => [s.lowKey.id, s.highKey.id])).join(" "),
			top === middle[middle.length - 1] ? top.highKey.id : top.lowKey.id
		);
		console.log("ANNEX  ", annex);
	}
	addDependentHint(type: DependentHintType, from: Stem, to: Stem) {
		console.log(
			DependentHintType[type],
			[from.lowKey.id, from.highKey.id],
			[to.lowKey.id, to.highKey.id]
		);
	}
}
