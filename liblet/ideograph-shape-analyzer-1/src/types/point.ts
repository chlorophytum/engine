import { GlyphPoint } from "@chlorophytum/arch";

export interface AdjPoint extends GlyphPoint {
	prev?: AdjPoint;
	next?: AdjPoint;
	prevZ?: AdjPoint;
	nextZ?: AdjPoint;
	xExtrema?: boolean;
	xStrongExtrema?: boolean;
	yExtrema?: boolean;
	yStrongExtrema?: boolean;
	atLeft?: boolean;
	turn?: boolean;
	touched?: boolean;
	dontTouch?: boolean;
	keyPoint?: boolean;
	linkedKey?: AdjPoint;
	slope?: number;
	blued?: boolean;
	ipKeys?: IpKeys;
	phantom?: IpPhantom;
}

export interface IpPhantom {
	xMin: number;
	xMax: number;
}
export interface IpKeys {
	upperK0: AdjPoint;
	lowerK0: AdjPoint;
	upperK: AdjPoint;
	lowerK: AdjPoint;
	ipPri: number;
}

export class CPoint implements AdjPoint {
	constructor(
		public x: number,
		public y: number,
		public on: boolean = true,
		public id: number = -1
	) {}
	xExtrema: boolean = false;
	xStrongExtrema: boolean = false;
	yExtrema: boolean = false;
	yStrongExtrema: boolean = false;
	atLeft: boolean = false;
	turn: boolean = false;
	touched: boolean = false;
	dontTouch: boolean = false;
	keyPoint: boolean = false;
	linkedKey?: AdjPoint;
	slope?: number;
	blued?: boolean;

	prev?: AdjPoint;
	next?: AdjPoint;
	prevZ?: AdjPoint;
	nextZ?: AdjPoint;
	ipKeys?: IpKeys;
	phantom?: IpPhantom;

	static adjacentZ(p: AdjPoint, q: AdjPoint) {
		return p.nextZ === q || p.prevZ === q || q.nextZ === p || q.prevZ === p;
	}

	static adjacent(p: AdjPoint, q: AdjPoint) {
		return p.next === q || p.prev === q || q.next === p || q.prev === p;
	}
}
