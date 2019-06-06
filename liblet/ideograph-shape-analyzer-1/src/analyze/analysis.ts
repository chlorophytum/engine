import { AdjPoint } from "../types/point";
import Radical from "../types/radical";
import Stem from "../types/stem";

export class Interpolation {
	constructor(
		public rp1: AdjPoint,
		public rp2: AdjPoint,
		public z: AdjPoint,
		public priority: number
	) {}
}
export class ShortAbsorption {
	constructor(public rp0: AdjPoint, public z: AdjPoint, public priority: number) {}
}

export class BlueZone {
	topZs: AdjPoint[] = [];
	bottomZs: AdjPoint[] = [];
}

export class ColMats {
	annexation: number[][] = [];
	darkness: number[][] = [];
	flips: number[][] = [];
	proximity: number[][] = [];
	spatialProximity: number[][] = [];
}

export class GlyphAnalysis {
	radicals: Radical[] = [];
	stems: Stem[] = [];
	stemOverlaps: number[][] = [];
	stemOverlapLengths: number[][] = [];
	directOverlaps: boolean[][] = [];
	symmetry: boolean[][] = [];
	collisionMatrices = new ColMats();
	blueZone = new BlueZone();
	interpolations: Interpolation[] = [];
	shortAbsorptions: ShortAbsorption[] = [];
}
