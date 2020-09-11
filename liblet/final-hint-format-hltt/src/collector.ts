import { IFinalHintCollector, Variation } from "@chlorophytum/arch";
import { CreateDSL, Edsl, initStdLib, InstrFormat, TtStat } from "@chlorophytum/hltt";
import { implDynamicCast, Typable, TypeRep } from "typable";
import { HlttPreStatSink } from "./pre-stat-sink";
import { HlttSession, HlttSessionImpl, SharedGlyphPrograms } from "./session";

export const HlttCollector = new TypeRep<HlttCollector>(
	"Chlorophytum::HlttFinalHintPlugin::HlttCollector"
);
export interface HlttCollector extends IFinalHintCollector {
	createSession(): HlttSession;
	getFunctionDefs<F>(format: InstrFormat<F>): Map<Edsl.Variable<Edsl.VkFpgm>, F>;
	getControlValueDefs(): (undefined | Variation.Variance<number>)[];
	getStats(): TtStat;
}

export class HlttCollectorImpl implements Typable<HlttCollector> {
	public readonly format = "hltt";
	private readonly edsl: Edsl.GlobalDsl;
	private shared = new SharedGlyphPrograms();

	constructor(pss: HlttPreStatSink) {
		this.edsl = CreateDSL(this.shared, {
			maxFunctionDefs: pss.maxFunctionDefs,
			maxStorage: pss.maxStorage,
			maxTwilightPoints: pss.maxTwilightPoints,
			stackHeight: pss.maxStack,
			cvtSize: pss.cvtSize,
			stackHeightMultiplier: 8,
			maxStorageMultiplier: 8
		});
		initStdLib(this.edsl);
	}
	public dynamicCast<U>(tr: TypeRep<U>): undefined | U {
		return implDynamicCast(tr, this, HlttCollector);
	}

	public createSession() {
		return new HlttSessionImpl(this.edsl, this.shared);
	}

	public getFunctionDefs<F>(format: InstrFormat<F>) {
		return this.edsl.compileFunctions(format);
	}
	public getControlValueDefs() {
		let cv: (undefined | Variation.Variance<number>)[] = [];
		for (const [variable, valueArr] of this.shared.controlValues) {
			for (let offset = 0; offset < variable.size; offset++) {
				cv[(variable.variableIndex || 0) + offset] = valueArr[offset];
			}
		}
		return cv;
	}
	public consolidate() {}
	public getStats() {
		return this.edsl.getStats();
	}
}
