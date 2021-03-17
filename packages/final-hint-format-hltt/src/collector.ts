import { IFinalHintCollector, Variation } from "@chlorophytum/arch";
import { ProgramAssembly, TtStat } from "@chlorophytum/hltt-next";
import { Assembler, InstrFormat, TTI } from "@chlorophytum/hltt-next-backend";
import { ProgramDef } from "@chlorophytum/hltt-next-tr";
import { implDynamicCast, Typable, TypeRep } from "typable";

import { HlttPreStatSink } from "./pre-stat-sink";
import { HlttSession, HlttSessionImpl, SharedGlyphPrograms } from "./session";

export const HlttCollector = new TypeRep<HlttCollector>(
	"Chlorophytum::HlttFinalHintPlugin::HlttCollector"
);
export interface HlttCollector extends IFinalHintCollector {
	createSession(): HlttSession;
	getFunctionDefs<F>(format: InstrFormat<F>): Map<symbol, F>;
	getControlValueDefs(): (undefined | Variation.Variance<number>)[];
	getStats(): TtStat;
}

export class HlttCollectorImpl implements Typable<HlttCollector> {
	public readonly format = "hltt";
	private readonly edsl: ProgramAssembly;
	private shared = new SharedGlyphPrograms();

	constructor(pss: HlttPreStatSink) {
		this.edsl = new ProgramAssembly(this.shared, {
			maxFunctionDefs: pss.maxFunctionDefs,
			maxStorage: pss.maxStorage,
			maxTwilightPoints: pss.maxTwilightPoints,
			stackHeight: pss.maxStack,
			cvtSize: pss.cvtSize,
			stackHeightMultiplier: 8,
			maxStorageMultiplier: 8
		});
		// initStdLib(this.edsl);
	}
	public dynamicCast<U>(tr: TypeRep<U>): undefined | U {
		return implDynamicCast(tr, this, HlttCollector);
	}

	public createSession() {
		return new HlttSessionImpl(this.edsl, this.shared);
	}

	public getFunctionDefs<F>(format: InstrFormat<F>) {
		const fpgmPrograms = new Map<symbol, F>();
		for (const sy of this.edsl.scope.fpgm.symbols()) {
			const ifn = this.edsl.scope.fpgm.resolve(sy);
			const defFn = this.edsl.scope.fpgm.getDef(sy);
			if (ifn == null || !defFn) continue;
			const pr = defFn.computeDefinition(this.edsl.scope);
			fpgmPrograms.set(sy, this.edsl.compileFunction(format, ifn, pr));
		}
		return fpgmPrograms;
	}

	public getControlValueDefs() {
		const cv: (undefined | Variation.Variance<number>)[] = [];
		for (const [variable, valueArr] of this.shared.controlValues) {
			const iCv = this.edsl.scope.cvt.resolve(variable);
			if (iCv === undefined) continue;
			for (let offset = 0; offset < valueArr.length; offset++) {
				cv[iCv + offset] = valueArr[offset] || 0;
			}
		}
		return cv;
	}
	public consolidate() {}
	public getStats() {
		return this.edsl.getStats();
	}
}
