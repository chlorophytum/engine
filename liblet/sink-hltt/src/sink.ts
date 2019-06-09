import { IFinalHintCollector, IFinalHintProgramSink, IFinalHintSession } from "@chlorophytum/arch";
import HLTT, {
	GlobalDsl,
	InstrFormat,
	ProgramDsl,
	ProgramRecord,
	Statement
} from "@chlorophytum/hltt";

export type ProgramGenerator = ($: ProgramDsl) => Iterable<Statement>;

export class HlttCollector implements IFinalHintCollector {
	readonly format = "hltt";
	readonly edsl = HLTT();
	createSession() {
		return new HlttSession(this.edsl);
	}

	getFunctionDefs<F>(format: InstrFormat<F>) {
		return this.edsl.compileFunctions(format);
	}
}

export class HlttSession implements IFinalHintSession {
	readonly format = "hltt";
	constructor(readonly edsl: GlobalDsl) {}
	glyphPrograms: Map<string, ProgramRecord> = new Map();
	preProgram: ProgramRecord | null = null;

	createGlyphProgramSink(gid: string) {
		return new HlttProgramSink(gen => this.glyphPrograms.set(gid, this.edsl.program(gen)));
	}
	private preProgramSegments: ProgramGenerator[] = [];
	createSharedProgramSink(type: string) {
		return new HlttProgramSink(gen => this.preProgramSegments.push(gen));
	}
	consolidatePreProgram() {
		const preSegments = this.preProgramSegments;
		this.preProgram = this.edsl.program(function*($) {
			for (const gen of preSegments) yield* gen($);
		});
	}

	getPreProgram<F>(format: InstrFormat<F>) {
		if (!this.preProgram) {
			return format.createSink().getResult();
		} else {
			return this.edsl.compileProgram(this.preProgram, format);
		}
	}
	getGlyphProgram<F>(gid: string, format: InstrFormat<F>) {
		const glyphProgram = this.glyphPrograms.get(gid);
		if (glyphProgram) {
			return this.edsl.compileProgram(glyphProgram, format);
		} else {
			return format.createSink().getResult();
		}
	}
}

export class HlttProgramSink implements IFinalHintProgramSink {
	readonly format = "hltt";
	private readonly generators: ProgramGenerator[] = [];

	constructor(private fSave: (gen: ProgramGenerator) => void) {}

	addSegment(gen: ProgramGenerator) {
		this.generators.push(gen);
	}
	*buildProgram($: ProgramDsl) {
		for (const gen of this.generators) yield* gen($);
	}
	save() {
		this.fSave($ => this.buildProgram($));
	}
}
