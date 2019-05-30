import { IFinalHintSink } from "../interfaces";
import { OTMaster } from "../ot-source";

export interface TtStats {
	maxFdef: number;
	maxInstrDef: number;
	maxStack: number;
	maxStorage: number;
	maxTwilights: number;
}

export abstract class TtFinalHintSink<Program> implements IFinalHintSink {
	abstract readonly format: string;
	abstract save(to: string): Promise<void>;
	abstract setGlyphProgram(glyphName: string, program: Program): void;
	abstract setPreProgram(program: Program): void;
	abstract setCvt(
		index: number,
		constant: number,
		variance?: { master: OTMaster; variance: number }[]
	): void;
	abstract setStats(stats: TtStats): void;
}
