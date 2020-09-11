import {
	Geometry,
	IFinalHintProgramSink,
	Variation,
	WellKnownGeometryKind
} from "@chlorophytum/arch";
import { Edsl } from "@chlorophytum/hltt";
import { implDynamicCast, Typable, TypeRep } from "typable";

export type ProgramGenerator = ($: Edsl.ProgramDsl) => Iterable<Edsl.Statement>;
export type CvtGenerator = (
	$: Edsl.GlobalDsl
) => Iterable<[Edsl.Variable<Edsl.VkCvt>, Variation.Variance<number>[]]>;

export const HlttProgramSink = new TypeRep<HlttProgramSink>(
	"Chlorophytum::HlttFinalHintPlugin::HlttProgramSink"
);
export interface HlttProgramSink extends IFinalHintProgramSink {
	addSegment(gen: ProgramGenerator): void;
	setDefaultControlValue(
		symbol: Edsl.Symbol<Edsl.VkCvt>,
		...values: (number | Variation.Variance<number>)[]
	): void;
	resolveGlyphPoint(from: Geometry.PointReference): number;
}

export class HlttProgramSinkImpl implements Typable<HlttProgramSink> {
	public readonly format = "hltt";
	private readonly generators: ProgramGenerator[] = [];
	private readonly pendingCvtSets: [Edsl.Symbol<Edsl.VkCvt>, Variation.Variance<number>[]][] = [];

	constructor(private fSave: (gen: ProgramGenerator, genCvt: CvtGenerator) => void) {}

	public dynamicCast<U>(tr: TypeRep<U>): undefined | U {
		return implDynamicCast(tr, this, HlttProgramSink);
	}

	public addSegment(gen: ProgramGenerator) {
		this.generators.push(gen);
	}
	public setDefaultControlValue(
		symbol: Edsl.Symbol<Edsl.VkCvt>,
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
		this.fSave(
			$ => this.buildProgram($),
			$ => this.buildCvt($)
		);
	}
	private *buildProgram($: Edsl.ProgramDsl) {
		for (const gen of this.generators) yield* gen($);
	}
	private *buildCvt(
		$: Edsl.GlobalDsl
	): IterableIterator<[Edsl.Variable<Edsl.VkCvt>, Variation.Variance<number>[]]> {
		for (const [symbol, value] of this.pendingCvtSets) {
			yield [$.convertSymbol(symbol), value];
		}
	}
	public resolveGlyphPoint(from: Geometry.PointReference): number {
		if (from.kind === WellKnownGeometryKind.Identity.kind) return from.id;
		throw new Error("Unable to resolve point. Not inside Geometry.");
	}
}
