export namespace Variation {
	export type Instance = { [axis: string]: number };
	export type Master = { [axis: string]: { min: number; peak: number; max: number } };
	export type Variance<T> = [null | Master, T][];
	export type MasterRep = { peak: Instance; master: Master };
}
