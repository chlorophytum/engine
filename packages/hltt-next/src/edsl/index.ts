import { GlobalScope } from "../tr/scope";

export interface TtStat {
	stackHeight?: number;
	stackHeightMultiplier?: number;
	maxStorage?: number;
	maxStorageMultiplier?: number;
	maxFunctionDefs?: number;
	maxTwilightPoints?: number;
	cvtSize?: number;
	varDimensionCount?: number;
}

export class ProgramAssembly {
	constructor(stat: TtStat) {
		this.scope = new GlobalScope({
			fpgm: stat.maxFunctionDefs || 0,
			twilights: stat.maxTwilightPoints || 0,
			storage: stat.maxStorage || 0,
			cvt: stat.cvtSize || 0,
			varDimensionCount: stat.varDimensionCount || 0
		});
	}

	public readonly scope: GlobalScope;
}
