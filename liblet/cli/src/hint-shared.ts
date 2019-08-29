import { IFontSourceMetadata } from "@chlorophytum/arch";
import * as Procs from "@chlorophytum/procs";

import { HintOptions } from "./env";

export interface HintWorkData {
	input: string;
	options: HintOptions;
}
export interface JobMessage<VAR, MASTER> {
	fontMetadata: IFontSourceMetadata;
	jobRequest: Procs.GlyphHintRequest<VAR, MASTER>;
}

export interface ReadyMessage {
	ready: boolean;
}
export interface LogMessage {
	log: string;
}

export type HintResults = { type: string; glyph: string; hintRep: any }[];
