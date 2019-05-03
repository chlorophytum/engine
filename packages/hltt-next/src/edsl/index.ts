import { Assembler, InstrFormat, RelocatablePushValue, TTI } from "@chlorophytum/hltt-next-backend";
import { AnyStmt } from "@chlorophytum/hltt-next-stmt";
import { GlobalScope, ProgramRecord, ProgramScope } from "@chlorophytum/hltt-next-tr";

import { addStdLib } from "../std-lib";

import { RootProgramDeclaration } from "./lib-system/programs";
import { ProgramScopeProxy } from "./scope-proxy";

export interface TtStat {
	generateRelocatableCode: boolean;
	stackPointerStorageID: number;
	varDimensionCount: number;

	stackHeight: number;
	stackHeightMultiplier: number;
	maxStorage: number;
	maxStorageMultiplier: number;
	maxFunctionDefs: number;
	maxTwilightPoints: number;
	cvtSize: number;
}

export class ProgramAssembly {
	constructor(private readonly stat: TtStat) {
		this.scope = new GlobalScope(
			{
				generateRelocatableCode: stat.generateRelocatableCode,
				stackPointerStorageID: stat.stackPointerStorageID
			},
			{
				varDimensionCount: stat.varDimensionCount,
				fpgmBase: stat.maxFunctionDefs,
				twilightsBase: stat.maxTwilightPoints,
				storageBase: stat.maxStorage,
				cvtBase: stat.cvtSize
			}
		);
		addStdLib(this.scope);
	}

	public readonly scope: GlobalScope;

	createProgram(body: (pps: ProgramScopeProxy) => Iterable<AnyStmt>) {
		return new RootProgramDeclaration(body);
	}

	public compileProgram<F>(name: string, format: InstrFormat<F>, pr: ProgramRecord) {
		const [ps, tr] = pr;
		const asm = new Assembler();

		ps.exitLabel = asm.createLabel();
		asm.programBegin();
		tr.compile(asm, ps);
		asm.label(ps.exitLabel);
		asm.programEnd();
		this.updateStat(ps, asm.maxStackHeight);
		return asm.codeGen(format.createSink(name));
	}

	public compileFunction<F>(
		name: string,
		format: InstrFormat<F>,
		iFn: RelocatablePushValue,
		pr: ProgramRecord
	) {
		const asm = new Assembler();
		const [ps, tr] = pr;
		ps.exitLabel = asm.createLabel();

		{
			asm.intro(iFn).prim(TTI.FDEF, 1, 0);
			asm.programBegin();
			tr.compile(asm, ps);
			asm.label(ps.exitLabel);
			asm.programEnd();
			asm.prim(TTI.ENDF, 0, 0);
		}

		this.updateStat(ps, asm.maxStackHeight);
		return asm.codeGen(format.createSink(name));
	}

	private updateStat(ls: ProgramScope, maxStack: number) {
		this.stat.maxFunctionDefs = Math.max(this.stat.maxFunctionDefs || 0, this.scope.fpgm.size);
		this.stat.stackHeight = Math.max(
			this.stat.stackHeight || 0,
			maxStack * (this.stat.stackHeightMultiplier || 1)
		);
		this.stat.maxTwilightPoints = Math.max(
			this.stat.maxTwilightPoints || 0,
			this.scope.twilightPoints.size
		);
		this.stat.maxStorage = Math.max(
			this.stat.maxStorage || 0,
			ls.locals.base +
				Math.max(0, ls.locals.size - ls.locals.base) * (this.stat.maxStorageMultiplier || 1)
		);
	}

	public consolidate() {
		this.scope.lockSymbolTables();
	}
	public getStats() {
		return this.stat;
	}
}
