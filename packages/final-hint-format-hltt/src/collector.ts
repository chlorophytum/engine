import { IFinalHintSink, IFinalHintStore, Variation } from "@chlorophytum/arch";
import { ProgramAssembly, TtStat } from "@chlorophytum/hltt-next";
import {
	InstrFormat,
	offsetRelocatablePushValue,
	resolveRelocatablePushValue,
	StatOnly
} from "@chlorophytum/hltt-next-backend";
import { implDynamicCast, Typable, TypeRep } from "typable";

import { HlttPreStatSink } from "./pre-stat-sink";
import { HlttSessionImpl, SharedGlyphPrograms } from "./session";

export const HlttCollector = new TypeRep<HlttCollector>(
	"Chlorophytum::HlttFinalHintPlugin::HlttCollector"
);
export interface HlttCollector extends IFinalHintSink, IFinalHintStore {
	preStatSink: HlttPreStatSink;
	getFunctionDefs<F>(format: InstrFormat<F>): Map<symbol, F>;
	getControlValueDefs(): (undefined | Variation.Variance<number>)[];
	getStats(): TtStat;
}

export interface HlttCollectorOptions {
	generateRelocatableCode?: null | undefined | boolean;
	stackPointerStorageID?: null | undefined | number;
}

export class HlttCollectorImpl implements Typable<HlttCollector> {
	public readonly format = "hltt";
	public preStatSink = new HlttPreStatSink();
	private programAssembly: null | ProgramAssembly = null;
	private shared = new SharedGlyphPrograms();

	constructor(private readonly options: HlttCollectorOptions) {}
	public dynamicCast<U>(tr: TypeRep<U>): undefined | U {
		return implDynamicCast(tr, this, HlttCollector);
	}

	private getProgramAssembly() {
		if (this.programAssembly) return this.programAssembly;

		const stackPointerStorageID =
			this.options.stackPointerStorageID ?? this.preStatSink.maxStorage;
		const volatileStorageStart = Math.max(
			1 + stackPointerStorageID,
			1 + this.preStatSink.maxStorage
		);

		this.programAssembly = new ProgramAssembly({
			generateRelocatableCode: !!this.options.generateRelocatableCode,
			stackPointerStorageID: stackPointerStorageID,
			varDimensionCount: this.preStatSink.varDimensionCount,
			maxFunctionDefs: this.preStatSink.maxFunctionDefs,
			maxStorage: volatileStorageStart,
			maxTwilightPoints: this.preStatSink.maxTwilightPoints,
			stackHeight: this.preStatSink.maxStack,
			cvtSize: this.preStatSink.cvtSize,
			stackHeightMultiplier: 32,
			maxStorageMultiplier: 32
		});
		return this.programAssembly;
	}

	public createSession() {
		const pa = this.getProgramAssembly();
		return new HlttSessionImpl(pa, this.shared);
	}

	public getFunctionDefs<F>(format: InstrFormat<F>) {
		const pa = this.getProgramAssembly();
		const fpgmPrograms = new Map<symbol, F>();
		for (const sy of pa.scope.fpgm.symbols()) {
			const ifn = pa.scope.fpgm.resolve(sy);
			const defFn = pa.scope.fpgm.getDef(sy);
			if (ifn == null || !defFn) continue;
			const pr = defFn.computeDefinition(pa.scope);
			fpgmPrograms.set(sy, pa.compileFunction(format, ifn, pr));
		}
		return fpgmPrograms;
	}

	public getControlValueDefs() {
		const pa = this.getProgramAssembly();
		const cv: (undefined | Variation.Variance<number>)[] = [];
		for (const [variable, valueArr] of this.shared.controlValues) {
			const iCv = pa.scope.cvt.resolve(variable);
			if (iCv === undefined) continue;
			for (let offset = 0; offset < valueArr.length; offset++) {
				const idx = resolveRelocatablePushValue(offsetRelocatablePushValue(iCv, offset));
				cv[idx] = valueArr[offset] || 0;
			}
		}
		return cv;
	}
	public async consolidate() {
		// Populate definitions used by function bodies, notably global storage's total size
		this.getFunctionDefs(StatOnly);
		this.getProgramAssembly().consolidate();
		return this;
	}
	public getStats() {
		const pa = this.getProgramAssembly();
		return pa.getStats();
	}
}
