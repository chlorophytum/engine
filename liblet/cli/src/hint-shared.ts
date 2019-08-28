import * as Procs from "@chlorophytum/procs";

import { HintOptions } from "./env";

export interface HintWorkData {
	input: string;
	options: HintOptions;
}
export interface JobMessage {
	job: Procs.GlyphHintJobs;
}

export interface ReadyMessage {
	ready: boolean;
}
export interface LogMessage {
	log: string;
}

export type HintResults = { type: string; glyph: string; hintRep: any }[];
