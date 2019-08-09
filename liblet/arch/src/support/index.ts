import { Point } from "../interfaces";

export function mix(x: number, y: number, a: number) {
	return x + (y - x) * a;
}
export function mixZ(p: Point, q: Point, x: number) {
	return { x: p.x + (q.x - p.x) * x, y: p.y + (q.y - p.y) * x };
}
export function lerp(x: number, x1: number, x2: number, y1: number, y2: number) {
	return ((x - x1) / (x2 - x1)) * (y2 - y1) + y1;
}
export function clamp(low: number, x: number, high: number) {
	return x < low ? low : x > high ? high : x;
}

export { Progress } from "./progress";
