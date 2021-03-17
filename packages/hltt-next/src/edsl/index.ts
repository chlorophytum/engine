import { Assembler, InstrFormat, TTI } from "@chlorophytum/hltt-next-backend";
import { GlobalScope, ProgramDef, ProgramRecord, ProgramScope } from "@chlorophytum/hltt-next-tr";

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
		return new RootProgramDeclaration(body);
	}

	public compileProgram<F>(format: InstrFormat<F>, pr: ProgramRecord) {
		const [ps, tr] = pr;
		const asm = new Assembler();
		tr.compile(asm, ps);
		this.updateStat(ps, asm.maxStackHeight);
		return asm.codeGen(format.createSink());
	}

	public compileFunction<F>(format: InstrFormat<F>, iFn: number, pr: ProgramRecord) {
		const asm = new Assembler();
		asm.push(iFn).prim(TTI.FDEF, 1, 0);

		const [ps, tr] = pr;
		ps.exitLabel = asm.createLabel();
		const h0 = asm.blockBegin();
		tr.compile(asm, ps);
		asm.blockEnd(h0, ps.exitLabel);

		asm.prim(TTI.ENDF, 0, 0);
		this.updateStat(ps, asm.maxStackHeight);
		return asm.codeGen(format.createSink());
	}

	private updateStat(ls: ProgramScope, maxStack: number) {
		this.stat.maxFunctionDefs = Math.max(
			this.stat.maxFunctionDefs || 0,
			this.scope.fpgm.base + this.scope.fpgm.size
		);
		this.stat.stackHeight = Math.max(
			this.stat.stackHeight || 0,
			maxStack * (this.stat.stackHeightMultiplier || 1)
		);
		this.stat.maxTwilightPoints = Math.max(
			this.stat.maxTwilightPoints || 0,
			this.scope.twilightPoints.base + this.scope.twilightPoints.size
		);
		this.stat.maxStorage = Math.max(
			this.stat.maxStorage || 0,
			ls.locals.base + ls.locals.size * (this.stat.maxStorageMultiplier || 1)
		);
	}

	public getStats() {
		return this.stat;
	}
}
