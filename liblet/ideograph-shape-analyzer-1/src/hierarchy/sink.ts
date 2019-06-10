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
	addStemPileHint(
		bot: Stem,
		middle: Stem[],
		top: Stem,
		botBound: boolean,
		topBound: boolean,
		annex: number[]
	) {}
	addDependentHint(type: DependentHintType, from: Stem, to: Stem) {}
	addStemEdgeAlign(stem: Stem) {}
}
