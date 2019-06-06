import { IFinalHintProgramSink, IFinalHintSink } from "@chlorophytum/arch";
import HLTT, { ProgramDsl, ProgramRecord, Statement } from "@chlorophytum/hltt";

export type ProgramGenerator = ($: ProgramDsl) => Iterable<Statement>;

export class HlttSink implements IFinalHintSink {
	readonly format = "hltt";
	readonly edsl = HLTT();
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
