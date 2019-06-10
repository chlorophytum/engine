import { HintingStrategy } from "../../strategy";
import Glyph from "../../types/glyph";
import Stem from "../../types/stem";

const SIZE = 255;

export class Bitmap {
	scale: number;
	yMin: number;
	yMax: number;

	constructor(strategy: HintingStrategy, public array: boolean[][]) {
		let scale = strategy.UPM / SIZE;
		let yMin = Math.floor((strategy.EMBOX_BOTTOM * strategy.UPM) / scale);
		let yMax = Math.ceil((strategy.EMBOX_TOP * strategy.UPM) / scale);
		this.scale = scale;
		this.yMin = yMin;
		this.yMax = yMax;
		this.array = array;
	}
	transform(x: number, y: number) {
		return {
			x: Math.round(x / this.scale),
			y: Math.round(y / this.scale) - this.yMin
		};
	}
	access(x: number, y: number) {
		if (x < 0 || x > SIZE * this.scale) return false;
		if (y < this.yMin * this.scale || y > this.yMax * this.scale) return false;
		return this.array[Math.round(x / this.scale)][Math.round(y / this.scale) - this.yMin];
	}
}

export function createImageBitmap(g: Glyph, strategy: HintingStrategy) {
	let scale = strategy.UPM / SIZE;
	let yMin = Math.floor((strategy.EMBOX_BOTTOM * strategy.UPM) / scale);
	let yMax = Math.ceil((strategy.EMBOX_TOP * strategy.UPM) / scale);
	let bitmap = new Array(SIZE + 1);
	for (let x = 0; x <= SIZE; x++) {
		bitmap[x] = new Array(yMax - yMin + 1);
		for (let y = yMin; y <= yMax; y++) {
			bitmap[x][y - yMin] = g.containsPoint({ x: x * scale, y: y * scale });
		}
	}
	return new Bitmap(strategy, bitmap);
}

class FlipAnalyzer {
	lifetime: number[] = [];
	enter<T>(a: T[]) {
		const turns = this.getTurns(a);
		for (let t = 0; t <= turns; t++) {
			this.lifetime[t] = (this.lifetime[t] || 0) + 1;
		}
	}
	getTurns<T>(a: T[]) {
		if (!a || !a.length) return 0;
		let v0 = a[0],
			turns = 0;
		for (let v of a) {
			if (v !== v0) {
				turns += 1;
				v0 = v;
			}
		}
		return turns;
	}
	computeFlips(limit: number) {
		let turns = 0;
		while (this.lifetime[turns] >= limit) turns++;
		return turns;
	}
}

export default function analyzeTurns(g: Glyph, strategy: HintingStrategy, stems: Stem[]) {
	const bitmap = createImageBitmap(g, strategy);
	const LIMIT = bitmap.transform(strategy.UPM / 4, 0).x;
	for (let s of stems) {
		let x1 = bitmap.transform(s.xMin, 0).x;
		let x2 = bitmap.transform(s.xMax, 0).x;
		let yBot = bitmap.transform(0, s.y - s.width).y - 1;
		let yTop = bitmap.transform(0, s.y).y + 1;
		if (!bitmap.array[x1] || !bitmap.array[x2]) continue;
		if (yBot > 0) {
			const fa = new FlipAnalyzer();
			for (let x = x1; x <= x2; x++) {
				if (!bitmap.array[x]) continue;
				fa.enter([...bitmap.array[x].slice(0, yBot), 1]);
			}
			s.turnsBelow = fa.computeFlips(LIMIT);
		}
		if (yTop > 0) {
			const fa = new FlipAnalyzer();
			for (let x = x1; x <= x2; x++) {
				if (!bitmap.array[x]) continue;
				fa.enter([1, ...bitmap.array[x].slice(yTop)]);
			}
			s.turnsAbove = fa.computeFlips(LIMIT);
		}
	}

	let turnMatrix: number[][] = [];
	for (let j = 0; j < stems.length; j++) {
		turnMatrix[j] = [];
		turnMatrix[j][j] = 0;
		const sj = stems[j];
		for (let k = 0; k < j; k++) {
			turnMatrix[j][k] = turnMatrix[k][j] = 0;
			const fa = new FlipAnalyzer();

			const sk = stems[k];
			let xj1 = bitmap.transform(sj.xMin, 0).x;
			let xj2 = bitmap.transform(sj.xMax, 0).x;
			let xk1 = bitmap.transform(sk.xMin, 0).x;
			let xk2 = bitmap.transform(sk.xMax, 0).x;
			let yBot = bitmap.transform(0, sj.y - sj.width).y - 1;
			let yTop = bitmap.transform(0, sk.y).y + 1;
			if (yBot <= yTop) continue;
			if (xk1 > xj2 || xj1 > xk2) continue;
			if (yBot < 0 || yTop < 0) continue;

			for (let x = Math.max(xj1, xk1); x <= Math.min(xj2, xk2); x++) {
				if (!bitmap.array[x]) continue;
				fa.enter([1, ...bitmap.array[x].slice(yTop, yBot), 1]);
			}
			turnMatrix[j][k] = turnMatrix[k][j] = fa.computeFlips(LIMIT);
		}
	}
	return turnMatrix;
}
