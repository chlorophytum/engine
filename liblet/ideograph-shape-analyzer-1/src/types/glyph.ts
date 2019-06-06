import { Point } from "@chlorophytum/arch";

import Contour, { inPoly } from "./contour";
import { CPoint } from "./point";
import { createStat, Stat } from "./stat";

export default class Glyph {
	constructor(public contours: Contour[] = []) {}
	nPoints = 0;
	indexedPoints: CPoint[] = [];

	stats: Stat = createStat();

	containsPoint(z: Point) {
		let nCW = 0,
			nCCW = 0;
		for (let j = 0; j < this.contours.length; j++) {
			if (inPoly(z, this.contours[j].points)) {
				if (this.contours[j].ccw) nCCW += 1;
				else nCW += 1;
			}
		}
		return nCCW !== nCW;
	}

	unifyZ() {
		for (let j = 0; j < this.contours.length; j++) {
			let pts = this.contours[j].points;
			for (let k = 0; k < pts.length; k++) {
				if (this.indexedPoints[pts[k].id]) {
					pts[k] = this.indexedPoints[pts[k].id];
				}
			}
		}
	}
	stat() {
		for (let c of this.contours) {
			c.stat();
			if (c.stats.xMin < this.stats.xMin) this.stats.xMin = c.stats.xMin;
			if (c.stats.yMin < this.stats.yMin) this.stats.yMin = c.stats.yMin;
			if (c.stats.xMax > this.stats.xMax) this.stats.xMax = c.stats.xMax;
			if (c.stats.yMax > this.stats.yMax) this.stats.yMax = c.stats.yMax;
		}
	}
}
