import { HintMain } from "@chlorophytum/arch";

import { HintOptions } from "./env";

export interface HintWorkData {
	input: string;
	options: HintOptions;
}
export interface JobMessage {
	job: HintMain.JobControl;
}

export interface ReadyMessage {
	ready: boolean;
}
export interface LogMessage {
	log: string;
}

export type HintResults = { glyph: string; hintRep: any }[];
