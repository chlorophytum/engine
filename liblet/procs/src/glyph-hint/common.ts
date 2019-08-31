import { GlyphRep, IHint, IHintingModelPlugin } from "@chlorophytum/arch";

export class GlyphHintStore {
	public glyphCacheKeys: Map<string, string> = new Map();
	public glyphHints: Map<string, IHint> = new Map();
	public sharedHints: null | IHint = null;
}
export interface GlyphHintSender {
	push(passID: string, gid: string, cacheKey: null | string, hints: IHint): void;
}

export interface GlyphHintJob {
	glyphName: string;
	cacheKey: null | string;
}
export interface GlyphHintRequest<VAR, MASTER> extends GlyphHintJob {
	glyphRep: GlyphRep<VAR, MASTER>;
}
export interface GlyphHintJobs {
	[type: string]: GlyphHintJob[];
}
export interface GlyphHintRequests<VAR, MASTER> {
	[type: string]: GlyphHintRequest<VAR, MASTER>[];
}

export interface IHintCacheManager {
	getCache(ck: string): null | undefined | IHint;
	setCache(ck: string, hints: IHint): void;
}
