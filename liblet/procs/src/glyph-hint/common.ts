import { Glyph, IHint } from "@chlorophytum/arch";

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
export interface GlyphHintRequest extends GlyphHintJob {
	glyphRep: Glyph.Rep;
}
export interface GlyphHintJobs {
	[type: string]: GlyphHintJob[];
}
export interface GlyphHintRequests {
	[type: string]: GlyphHintRequest[];
}

export interface IHintCacheManager {
	getCache(ck: string): null | undefined | IHint;
	setCache(ck: string, hints: IHint): void;
}
