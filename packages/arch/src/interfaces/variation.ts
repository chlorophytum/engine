export namespace Variation {
	// Datatype of "master" is format-dependent
	export type Master = unknown;
	export type Instance = { readonly [axis: string]: number };
	export type Variance<T> = [null | Master, T][];
	export type MasterRep<T = unknown> = { peak: Instance; master: T };

	export type UserInstance = { readonly user: Instance };
	export type UserMaster = { readonly user: Master };
}
