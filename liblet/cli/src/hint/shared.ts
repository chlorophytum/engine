import { HintOptions } from "../env";

export interface HintWorkData {
	options: HintOptions;
}
export interface TaskMessage {
	taskID: number;
	taskType: string;
	taskArgs: any;
}
export interface TaskResultMessage {
	taskID: number;
	taskResult: any;
}
export interface TaskErrorMessage {
	taskID: number;
	taskError: string;
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
