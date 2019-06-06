import { Point } from "@chlorophytum/arch";

import HintingStrategy from "../../strategy";
import Glyph from "../../types/glyph";
import { CPoint } from "../../types/point";
import { GlyphAnalysis } from "../analysis";

function nearTop(z1: Point, z2: Point, d: number) {
	return Math.hypot(z1.x - z2.x, z1.y - z2.y) < d;
}
function nearBot(z1: Point, z2: Point, d: number) {
	return Math.abs(z1.y - z2.y) <= d;
}

export default function analyzeBlueZonePoints(
	glyph: Glyph,
	analysis: GlyphAnalysis,
	strategy: HintingStrategy
) {
	// Blue zone points
	let topBluePoints = [];
	let bottomBluePoints = [];
	for (let j = 0; j < glyph.contours.length; j++) {
		for (let k = 0; k < glyph.contours[j].points.length - 1; k++) {
			let point = glyph.contours[j].points[k];
			let isDecoTop = false;
			let isDecoBot = false;
			for (let m = 0; m < glyph.contours[j].points.length - 1; m++) {
				let zm = glyph.contours[j].points[m];
				if (
					(zm.touched || zm.dontTouch) &&
					(CPoint.adjacent(point, zm) || CPoint.adjacentZ(point, zm)) &&
					zm.y <= point.y &&
					nearTop(point, zm, strategy.STEM_SIDE_MIN_RISE)
				) {
					isDecoTop = true;
					point.dontTouch = true;
				}
				if (
					(zm.touched || zm.dontTouch) &&
					(CPoint.adjacent(point, zm) || CPoint.adjacentZ(point, zm)) &&
					zm.y >= point.y &&
					nearBot(point, zm, strategy.STEM_SIDE_MIN_RISE / 3)
				) {
					isDecoBot = true;
					point.dontTouch = true;
				}
			}
			if (
				!isDecoTop &&
				point.y >= strategy.BLUE_ZONE_TOP_LIMIT &&
				point.yExtrema &&
				!point.touched &&
				!point.dontTouch
			) {
				point.touched = true;
				point.keyPoint = true;
				point.blued = true;
				topBluePoints.push(point);
			}
			if (
				!isDecoBot &&
				point.y <= strategy.BLUE_ZONE_BOTTOM_LIMIT &&
				point.yExtrema &&
				!point.touched &&
				!point.dontTouch
			) {
				point.touched = true;
				point.keyPoint = true;
				point.blued = true;
				bottomBluePoints.push(point);
			}
		}
	}
	return {
		topZs: topBluePoints.sort((a, b) => b.y - a.y),
		bottomZs: bottomBluePoints.sort((a, b) => b.y - a.y)
	};
}
