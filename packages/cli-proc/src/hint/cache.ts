/* eslint-disable @typescript-eslint/no-explicit-any */
import * as stream from "stream";

import { IHint, IHintCacheManager, IHintFactory } from "@chlorophytum/arch";
import { StreamJsonZip } from "@chlorophytum/util-json";

type HintCacheRep = {
	[ck: string]: any;
};

export class HintCache implements IHintCacheManager {
	constructor(private readonly hf: IHintFactory) {}
	private fallbackStore = new Map<string, any>();
	private store = new Map<string, any>();
	public clear() {
		this.fallbackStore = new Map();
		this.store = new Map();
	}
	public getCache(id: null | string) {
		if (!id) return undefined;

		let hintRep = this.store.get(id);
		if (!hintRep) {
			const hintRepOld = hintRep;
			hintRep = this.fallbackStore.get(id);
			if (hintRep && !hintRepOld) {
				this.store.set(id, hintRep);
				this.fallbackStore.delete(id);
			}
		}

		if (!hintRep) {
			return undefined;
		} else {
			return this.hf.readJson(hintRep, this.hf);
		}
	}
	public setCache(id: null | string, hint: IHint) {
		if (!id || !hint) return;
		this.store.set(id, hint.toJSON());
		this.fallbackStore.delete(id);
	}
	public async load(input: stream.Readable) {
		const rep = await StreamJsonZip.parse(input);
		for (const ck in rep) {
			this.fallbackStore.set(ck, rep[ck]);
		}
	}
	public save(out: stream.Writable) {
		const rep: HintCacheRep = {};
		for (const [ck, hint] of this.store) rep[ck] = hint;
		return StreamJsonZip.stringify(rep, out);
	}
}
