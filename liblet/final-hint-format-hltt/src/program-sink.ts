import { IFinalHintProgramSink, Variation } from "@chlorophytum/arch";
import { EdslSymbol, GlobalDsl, ProgramDsl, Statement, Variable } from "@chlorophytum/hltt";
import { implDynamicCast, Typable, TypeRep } from "typable";

export type ProgramGenerator = ($: ProgramDsl) => Iterable<Statement>;
export type CvtGenerator = ($: GlobalDsl) => Iterable<[Variable, Variation.Variance<number>[]]>;

export const HlttProgramSink = new TypeRep<HlttProgramSink>(
	"Chlorophytum::HlttFinalHintPlugin::HlttProgramSink"
);
export interface HlttProgramSink extends IFinalHintProgramSink {
	addSegment(gen: ProgramGenerator): void;
	setDefaultControlValue(
		symbol: EdslSymbol,
		...values: (number | Variation.Variance<number>)[]
	): void;
}

export class HlttProgramSinkImpl implements Typable<HlttProgramSink> {
	public readonly format = "hltt";
	private readonly generators: ProgramGenerator[] = [];
	private readonly pendingCvtSets: [EdslSymbol, Variation.Variance<number>[]][] = [];

	constructor(private fSave: (gen: ProgramGenerator, genCvt: CvtGenerator) => void) {}

	public dynamicCast<U>(tr: TypeRep<U>): undefined | U {
		return implDynamicCast(tr, this, HlttProgramSink);
	}

	public addSegment(gen: ProgramGenerator) {
		this.generators.push(gen);
	}
	public setDefaultControlValue(
		symbol: EdslSymbol,
		...values: (number | Variation.Variance<number>)[]
	) {
		let results: Variation.Variance<number>[] = [];
		for (const value of values) {
			if (typeof value === "number") results.push([[null, value]]);
			else results.push(value);
		}
		this.pendingCvtSets.push([symbol, results]);
	}
	public save() {
		this.fSave($ => this.buildProgram($), $ => this.buildCvt($));
	}
	private *buildProgram($: ProgramDsl) {
		for (const gen of this.generators) yield* gen($);
	}
	private *buildCvt($: GlobalDsl): IterableIterator<[Variable, Variation.Variance<number>[]]> {
		for (const [symbol, value] of this.pendingCvtSets) {
			yield [$.convertSymbol(symbol), value];
		}
	}
}
