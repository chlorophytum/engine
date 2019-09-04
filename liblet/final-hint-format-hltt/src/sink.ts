import {
	IFinalHintCollector,
	IFinalHintPreStatSink,
	IFinalHintProgramSink,
	IFinalHintSession,
	Variation
} from "@chlorophytum/arch";
import {
	CreateDSL,
	EdslSymbol,
	GlobalDsl,
	initStdLib,
	InstrFormat,
	ProgramDsl,
	ProgramRecord,
	Statement,
	TtStat,
	Variable
} from "@chlorophytum/hltt";

export type ProgramGenerator = ($: ProgramDsl) => Iterable<Statement>;
export type CvtGenerator = ($: GlobalDsl) => Iterable<[Variable, Variation.Variance<number>[]]>;

class SharedGlyphPrograms {
	public fpgm: Map<Variable, ProgramRecord> = new Map();
	public programs: Map<string, ProgramRecord> = new Map();
	public controlValues: [Variable, Variation.Variance<number>[]][] = [];
}

export class HlttCollector implements IFinalHintCollector {
	public readonly format = "hltt";
	private readonly edsl: GlobalDsl;
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
	public createSession() {
		return new HlttSession(this.edsl, this.shared);
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

export interface HlttFinalHintStoreRep<F> {
	stats: TtStat;
	fpgm: F[];
	prep: F[];
	glyf: { [key: string]: string };
	cvt: (null | undefined | Variation.Variance<number>)[];
}

export class HlttSession implements IFinalHintSession {
	public readonly format = "hltt";
	constructor(private readonly edsl: GlobalDsl, private readonly shared: SharedGlyphPrograms) {}

	private readonly cacheKeyMaps: Map<string, string> = new Map();
	private glyphPrograms: Map<string, ProgramRecord> = new Map();
	private preProgramSegments: ProgramGenerator[] = [];
	private preProgram: ProgramRecord | null = null;

	public createGlyphProgramSink(gid: string, ck?: null | undefined | string) {
		if (ck) {
			this.cacheKeyMaps.set(gid, ck);
			if (!this.shared.programs.has(ck)) {
				return new HlttProgramSink((gen, cv) => {
					this.shared.programs.set(ck, this.edsl.program(gen));
					this.saveControlValues(cv);
				});
			} else {
				return new HlttProgramSink(gen => {});
			}
		} else {
			return new HlttProgramSink((gen, cv) => {
				this.glyphPrograms.set(gid, this.edsl.program(gen));
				this.saveControlValues(cv);
			});
		}
	}
	public createSharedProgramSink(type: string) {
		return new HlttProgramSink((gen, cv) => {
			this.preProgramSegments.push(gen);
			this.saveControlValues(cv);
		});
	}
	public consolidatePreProgram() {
		const preSegments = this.preProgramSegments;
		this.preProgram = this.edsl.program(function*($) {
			for (const gen of preSegments) yield* gen($);
		});
		this.preProgramSegments = [];
	}
	private saveControlValues(cv: CvtGenerator) {
		const entries = Array.from(cv(this.edsl));
		for (const entry of entries) this.shared.controlValues.push(entry);
	}
	public consolidate() {
		this.consolidatePreProgram();
	}

	public *listGlyphNames() {
		yield* this.glyphPrograms.keys();
		yield* this.cacheKeyMaps.keys();
	}
	public getPreProgram<F>(format: InstrFormat<F>) {
		if (!this.preProgram) {
			return format.createSink().getResult();
		} else {
			return this.edsl.compileProgram(this.preProgram, format);
		}
	}
	public getGlyphProgram<F>(
		gid: string,
		format: InstrFormat<F>,
		si?: null | undefined | Map<string, F>
	) {
		const ck = this.cacheKeyMaps.get(gid);
		if (ck) {
			const existing = si ? si.get(ck) : undefined;
			if (existing) return existing;
			const glyphProgram = this.shared.programs.get(ck);
			if (glyphProgram) {
				const instr = this.edsl.compileProgram(glyphProgram, format);
				if (si) si.set(ck, instr);
				return instr;
			} else {
				return format.createSink().getResult();
			}
		} else {
			const glyphProgram = this.glyphPrograms.get(gid);
			if (glyphProgram) {
				return this.edsl.compileProgram(glyphProgram, format);
			} else {
				return format.createSink().getResult();
			}
		}
	}
}

export class HlttProgramSink implements IFinalHintProgramSink {
	public readonly format = "hltt";
	private readonly generators: ProgramGenerator[] = [];
	private readonly pendingCvtSets: [EdslSymbol, Variation.Variance<number>[]][] = [];

	constructor(private fSave: (gen: ProgramGenerator, genCvt: CvtGenerator) => void) {}

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
		for (const [symbol, value] of this.pendingCvtSets) yield [$.convertSymbol(symbol), value];
	}
}

export class TtFinalHintStore<F> {
	public glyphHints = new Map<string, F>();
	public fpgm?: F;
	public prep?: F;
}

export class HlttPreStatSink implements IFinalHintPreStatSink {
	public maxFunctionDefs = 0;
	public maxTwilightPoints = 0;
	public maxStorage = 0;
	public maxStack = 0;
	public cvtSize = 0;
	public settleDown() {}
}
