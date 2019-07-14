import { IFinalHintCollector, IFinalHintProgramSink, IFinalHintSession } from "@chlorophytum/arch";
import HLTT, {
	GlobalDsl,
	initStdLib,
	InstrFormat,
	ProgramDsl,
	ProgramRecord,
	Statement
} from "@chlorophytum/hltt";

export type ProgramGenerator = ($: ProgramDsl) => Iterable<Statement>;

export class HlttCollector implements IFinalHintCollector {
	public readonly format = "hltt";
	public readonly edsl: GlobalDsl;
	constructor() {
		this.edsl = HLTT();
		initStdLib(this.edsl);
	}
	public createSession() {
		return new HlttSession(this.edsl);
	}

	public getFunctionDefs<F>(format: InstrFormat<F>) {
		return this.edsl.compileFunctions(format);
	}
	public consolidate() {}
}

export class HlttSession implements IFinalHintSession {
	public readonly format = "hltt";
	constructor(readonly edsl: GlobalDsl) {}
	public glyphPrograms: Map<string, ProgramRecord> = new Map();
	public preProgram: ProgramRecord | null = null;

	public createGlyphProgramSink(gid: string) {
		return new HlttProgramSink(gen => this.glyphPrograms.set(gid, this.edsl.program(gen)));
	}
	private preProgramSegments: ProgramGenerator[] = [];
	public createSharedProgramSink(type: string) {
		return new HlttProgramSink(gen => this.preProgramSegments.push(gen));
	}
	public consolidatePreProgram() {
		const preSegments = this.preProgramSegments;
		this.preProgram = this.edsl.program(function*($) {
			for (const gen of preSegments) yield* gen($);
		});
	}
	public consolidate() {
		this.consolidatePreProgram();
	}

	public getPreProgram<F>(format: InstrFormat<F>) {
		if (!this.preProgram) {
			return format.createSink().getResult();
		} else {
			return this.edsl.compileProgram(this.preProgram, format);
		}
	}
	public getGlyphProgram<F>(gid: string, format: InstrFormat<F>) {
		const glyphProgram = this.glyphPrograms.get(gid);
		if (glyphProgram) {
			return this.edsl.compileProgram(glyphProgram, format);
		} else {
			return format.createSink().getResult();
		}
	}
}

export class HlttProgramSink implements IFinalHintProgramSink {
	public readonly format = "hltt";
	private readonly generators: ProgramGenerator[] = [];

	constructor(private fSave: (gen: ProgramGenerator) => void) {}

	public addSegment(gen: ProgramGenerator) {
		this.generators.push(gen);
	}
	public *buildProgram($: ProgramDsl) {
		for (const gen of this.generators) yield* gen($);
	}
	public save() {
		this.fSave($ => this.buildProgram($));
	}
}

export class TtFinalHintStore<F> {
	public glyphHints = new Map<string, F>();
	public fpgm?: F;
	public prep?: F;
}
