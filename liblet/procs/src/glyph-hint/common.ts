import { GlyphRep, IHint, IHintingModelPlugin } from "@chlorophytum/arch";

export class GlyphHintStore {
	public glyphHints: Map<string, IHint> = new Map();
	public sharedHints: null | IHint = null;
}
export interface GlyphHintSender {
	push(type: string, gid: string, hints: IHint): void;
}

export interface GlyphHintJobs {
	[type: string]: string[];
}
export interface GlyphHintRequest<VAR, MASTER> {
	[type: string]: [string, GlyphRep<VAR, MASTER>][];
}

export function findMatchingFactory(type: string, modelFactories: IHintingModelPlugin[]) {
	for (const mf of modelFactories) if (mf.type === type) return mf;
	return null;
}
