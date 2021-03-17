import { GlobalScope, ProgramRecord } from "@chlorophytum/hltt-next-tr";

import { RootProgramDeclaration } from "./lib-system/programs";
import { ProgramScopeProxy } from "./scope-proxy";
import { AnyStmt } from "./stmt-impl/branch";

export interface ProgramStore {
	fpgm: Map<symbol, ProgramRecord>;
}

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
	constructor(private readonly store: ProgramStore, private readonly stat: TtStat) {
		this.scope = new GlobalScope({
			fpgm: stat.maxFunctionDefs || 0,
			twilights: stat.maxTwilightPoints || 0,
			storage: stat.maxStorage || 0,
			cvt: stat.cvtSize || 0,
			varDimensionCount: stat.varDimensionCount || 0
		});
	}

	public readonly scope: GlobalScope;

	createProgram(body: (pps: ProgramScopeProxy) => Iterable<AnyStmt>) {
		const decl = new RootProgramDeclaration(body);
		return decl;
	}
}
