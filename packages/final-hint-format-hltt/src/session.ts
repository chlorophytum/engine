import { IFinalHintSession, Variation } from "@chlorophytum/arch";
import { ProgramAssembly, TtStat } from "@chlorophytum/hltt-next";
import { InstrFormat, StatOnly } from "@chlorophytum/hltt-next-backend";
import { ProgramRecord } from "@chlorophytum/hltt-next-tr";
import { implDynamicCast, Typable, TypeRep } from "typable";

import {
	CvtGenerator,
	HlttProgramSink,
	HlttProgramSinkImpl,
	ProgramGenerator
} from "./program-sink";

export class SharedGlyphPrograms {
	public fpgm: Map<symbol, ProgramRecord> = new Map();
	public programs: Map<string, ProgramRecord> = new Map();
	public controlValues: [symbol, Variation.Variance<number>[]][] = [];
}

export interface HlttFinalHintStoreRep<F> {
	stats: TtStat;
	fpgm: F[];
	prep: F[];
	glyf: { [key: string]: F };
	cvt: (null | undefined | Variation.Variance<number>)[];
}

export const HlttSession = new TypeRep<HlttSession>(
	"Chlorophytum::HlttFinalHintPlugin::HlttSession"
);
export interface HlttSession extends IFinalHintSession {
	getPreProgram<F>(format: InstrFormat<F>): F;
	listGlyphNames(): Iterable<string>;
	getGlyphProgram<F>(
		gid: string,
		format: InstrFormat<F>,
		cache?: null | undefined | Map<string, F>
	): F;
}

export class HlttSessionImpl implements Typable<HlttSession> {
	public readonly format = "hltt";
	constructor(
		private readonly edsl: ProgramAssembly,
		private readonly shared: SharedGlyphPrograms
	) {}

	public dynamicCast<U>(tr: TypeRep<U>): undefined | U {
		return implDynamicCast(tr, this, HlttSession);
	}

	private readonly cacheKeyMaps: Map<string, string> = new Map();
	private glyphPrograms: Map<string, ProgramRecord> = new Map();
	private preProgramSegments: ProgramGenerator[] = [];
	private preProgram: ProgramRecord | null = null;

	public async createGlyphProgramSink(
		gid: string,
		ck?: null | undefined | string
	): Promise<HlttProgramSink> {
		if (ck) {
			this.cacheKeyMaps.set(gid, ck);
			if (!this.shared.programs.has(ck)) {
				return new HlttProgramSinkImpl((gen, cv) => {
					this.shared.programs.set(
						ck,
						this.edsl.createProgram(gen).computeDefinition(this.edsl.scope)
					);
					this.saveControlValues(cv);
				});
			} else {
				return new HlttProgramSinkImpl(gen => {});
			}
		} else {
			return new HlttProgramSinkImpl((gen, cv) => {
				this.glyphPrograms.set(
					gid,
					this.edsl.createProgram(gen).computeDefinition(this.edsl.scope)
				);
				this.saveControlValues(cv);
			});
		}
	}
	public async createSharedProgramSink(type: string): Promise<HlttProgramSink> {
		return new HlttProgramSinkImpl((gen, cv) => {
			this.preProgramSegments.push(gen);
			this.saveControlValues(cv);
		});
	}
	private saveControlValues(cv: CvtGenerator) {
		const entries = Array.from(cv(this.edsl));
		for (const [decl, val] of entries) this.shared.controlValues.push([decl.symbol, val]);
	}

	public consolidate() {
		this.consolidatePreProgram();
		this.populateFpgm();
	}
	private consolidatePreProgram() {
		const preSegments = this.preProgramSegments;
		this.preProgram = this.edsl
			.createProgram(function* ($) {
				for (const gen of preSegments) yield* gen($);
			})
			.computeDefinition(this.edsl.scope);
		this.preProgramSegments = [];
	}
	private populateFpgm() {
		// Perform compilation to populate FPGM entries
		this.getPreProgram(StatOnly);
		for (const gid of this.listGlyphNames()) this.getGlyphProgram(gid, StatOnly);
	}

	public *listGlyphNames() {
		yield* this.glyphPrograms.keys();
		yield* this.cacheKeyMaps.keys();
	}
	public getPreProgram<F>(format: InstrFormat<F>) {
		if (!this.preProgram) {
			return format.createSink().getResult();
		} else {
			return this.edsl.compileProgram(format, this.preProgram);
		}
	}
	public getGlyphProgram<F>(
		gid: string,
		format: InstrFormat<F>,
		cache?: null | undefined | Map<string, F>
	) {
		const ck = this.cacheKeyMaps.get(gid);
		if (ck) {
			const existing = cache ? cache.get(ck) : undefined;
			if (existing) return existing;
			const glyphProgram = this.shared.programs.get(ck);
			if (glyphProgram) {
				const instr = this.edsl.compileProgram(format, glyphProgram);
				if (cache) cache.set(ck, instr);
				return instr;
			} else {
				return format.createSink().getResult();
			}
		} else {
			const glyphProgram = this.glyphPrograms.get(gid);
			if (glyphProgram) {
				return this.edsl.compileProgram(format, glyphProgram);
			} else {
				return format.createSink().getResult();
			}
		}
	}
}
