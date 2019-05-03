export interface InstanceTuple {
	[axis: string]: number | undefined;
}

export interface IGlyphPoint {
	readonly x: number;
	readonly y: number;
	readonly onCurve: boolean;
}
export interface ReadonlyHPoint extends IGlyphPoint {
	readonly xH: number; // Hinted X, in pixels
	readonly yH: number; // Hinted Y, in pixels
	readonly touched: boolean; // Whether point is touched
}

export class HPoint implements ReadonlyHPoint {
	// Original
	readonly x: number;
	readonly y: number;
	readonly onCurve: boolean;

	// Hinted
	xH: number; // Hinted X, in pixels
	yH: number; // Hinted Y, in pixels
	touched: boolean = false;

	constructor(z: IGlyphPoint) {
		this.x = this.xH = z.x;
		this.y = this.yH = z.y;
		this.onCurve = z.onCurve;
	}

	// TODO: use F26DOT6 arithmetics
	initialize(upm: number, ppem: number) {
		this.touched = false;
		const upp = upm / ppem;
		this.xH = this.x / upp;
		this.yH = this.y / upp;
	}
}

export interface GlyphGeometry {
	readonly shape: ReadonlyArray<ReadonlyArray<HPoint>>;
	toPointIndex(z: HPoint): number;
}
