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

class SharedGlyphPrograms {
	public programs: Map<string, ProgramRecord> = new Map();
}

export class HlttCollector implements IFinalHintCollector {
	public readonly format = "hltt";
	public readonly edsl: GlobalDsl;
	public sharedGlyphPrograms = new SharedGlyphPrograms();
	constructor() {
		this.edsl = HLTT();
		initStdLib(this.edsl);
	}
	public createSession() {
		return new HlttSession(this.edsl, this.sharedGlyphPrograms);
	}

	public getFunctionDefs<F>(format: InstrFormat<F>) {
		return this.edsl.compileFunctions(format);
	}
	public consolidate() {}
}

export class HlttSession implements IFinalHintSession {
	public readonly format = "hltt";
	constructor(readonly edsl: GlobalDsl, private readonly shared: SharedGlyphPrograms) {}

	private readonly cacheKeyMaps: Map<string, string> = new Map();
	private glyphPrograms: Map<string, ProgramRecord> = new Map();
	private preProgram: ProgramRecord | null = null;

	public createGlyphProgramSink(gid: string, ck?: null | undefined | string) {
		return new HlttProgramSink(gen => {
			const program = this.edsl.program(gen);
			if (ck) {
				this.cacheKeyMaps.set(gid, ck);
				if (!this.shared.programs.has(ck)) this.shared.programs.set(ck, program);
			} else {
				this.glyphPrograms.set(gid, program);
			}
		});
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
		this.preProgramSegments = [];
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
