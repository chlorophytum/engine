import {
	Geometry,
	IFinalHintProgramSink,
	Variation,
	WellKnownGeometryKind
} from "@chlorophytum/arch";
import { ProgramAssembly, ProgramScopeProxy } from "@chlorophytum/hltt-next";
import { Expr, glyphPoint } from "@chlorophytum/hltt-next-expr";
import { ExprVarCvt } from "@chlorophytum/hltt-next-expr-impl";
import { AnyStmt } from "@chlorophytum/hltt-next-stmt";
import { Decl } from "@chlorophytum/hltt-next-tr";
import { GlyphPoint, TT } from "@chlorophytum/hltt-next-type-system";
import { implDynamicCast, Typable, TypeRep } from "typable";

export type ProgramGenerator = ($: ProgramScopeProxy) => Iterable<AnyStmt>;
export type CvtGenerator = ($: ProgramAssembly) => Iterable<[Decl, Variation.Variance<number>[]]>;

export const HlttProgramSink = new TypeRep<HlttProgramSink>(
	"Chlorophytum::HlttFinalHintPlugin::HlttProgramSink"
);
export interface HlttProgramSink extends IFinalHintProgramSink {
	createBranch(): HlttProgramSink;
	buildProgram($: ProgramScopeProxy): Iterable<AnyStmt>;
	addSegment(gen: ProgramGenerator): void;
	setDefaultControlValue(
		expr: ExprVarCvt<TT>,
		...values: (number | Variation.Variance<number>)[]
	): void;
	resolveGlyphPoint(from: Geometry.PointReference): Expr<GlyphPoint>;
}

export class HlttProgramSinkImpl implements Typable<HlttProgramSink> {
	public readonly format = "hltt";
	private readonly generators: ProgramGenerator[] = [];
	private readonly pendingCvtSets: [Decl, Variation.Variance<number>[]][] = [];

	constructor(private fSave: (gen: ProgramGenerator, genCvt: CvtGenerator) => void) {}

	public dynamicCast<U>(tr: TypeRep<U>): undefined | U {
		return implDynamicCast(tr, this, HlttProgramSink);
	}

	public createBranch(): HlttProgramSink {
		return new HlttBranchSinkImpl(this);
	}
	public addSegment(gen: ProgramGenerator) {
		this.generators.push(gen);
	}
	public setDefaultControlValue(
		expr: ExprVarCvt<TT>,
		...values: (number | Variation.Variance<number>)[]
	) {
		if (!expr.decl) throw new TypeError("Cannot use coerced expressions");
		const results: Variation.Variance<number>[] = [];
		for (const value of values) {
			if (typeof value === "number") results.push([[null, value]]);
			else results.push(value);
		}
		this.pendingCvtSets.push([expr.decl, results]);
	}
	public save() {
		this.fSave(
			$ => this.buildProgram($),
			$ => this.buildCvt($)
		);
	}
	public *buildProgram($: ProgramScopeProxy): IterableIterator<AnyStmt> {
		for (const gen of this.generators) yield* gen($);
	}
	private *buildCvt($: ProgramAssembly): IterableIterator<[Decl, Variation.Variance<number>[]]> {
		for (const [decl, value] of this.pendingCvtSets) {
			yield [decl, value];
		}
	}
	public resolveGlyphPoint(from: Geometry.PointReference): Expr<GlyphPoint> {
		if (from.kind === WellKnownGeometryKind.PointID.kind) return glyphPoint(from.id);
		throw new Error("Unable to resolve point. Not inside Geometry.");
	}
}

export class HlttBranchSinkImpl implements Typable<HlttProgramSink> {
	public readonly format = "hltt::branch";
	private readonly generators: ProgramGenerator[] = [];

	constructor(private readonly parent: HlttProgramSink) {}

	public dynamicCast<U>(tr: TypeRep<U>): undefined | U {
		return implDynamicCast(tr, this, HlttProgramSink);
	}

	public createBranch(): HlttProgramSink {
		return new HlttBranchSinkImpl(this);
	}
	public *buildProgram($: ProgramScopeProxy): IterableIterator<AnyStmt> {
		for (const gen of this.generators) yield* gen($);
	}
	public save() {}
	public addSegment(gen: ProgramGenerator) {
		this.generators.push(gen);
	}
	public setDefaultControlValue(
		expr: ExprVarCvt<TT>,
		...values: (number | Variation.Variance<number>)[]
	) {
		return this.parent.setDefaultControlValue(expr, ...values);
	}
	public resolveGlyphPoint(from: Geometry.PointReference): Expr<GlyphPoint> {
		return this.parent.resolveGlyphPoint(from);
	}
}
