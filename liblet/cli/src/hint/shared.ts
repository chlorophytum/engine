import { IFontSourceMetadata } from "@chlorophytum/arch";
import * as Procs from "@chlorophytum/procs";

import { HintOptions } from "../env";

export interface HintWorkData {
	input: string;
	options: HintOptions;
}
export interface JobMessage {
	fontMetadata: IFontSourceMetadata;
	jobRequests: Procs.GlyphHintRequests;
}

export interface ReadyMessage {
	ready: boolean;
}
export interface LogMessage {
	log: string;
}

export type HintResults = {
	passID: string;
	glyph: string;
	cacheKey: null | string;
	hintRep: any;
}[];
