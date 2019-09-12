import {
	EmptyImpl,
	IHint,
	IHintFactory,
	IHintingModelPlugin,
	IHintStore,
	IHintStoreProvider
} from "@chlorophytum/arch";
import { MemoryHintStore } from "@chlorophytum/hint-store-memory";
import { StreamJsonZip } from "@chlorophytum/util-json";
import * as fs from "fs";
import * as stream from "stream";

export class HintStoreFsProvider implements IHintStoreProvider {
	public async connectRead(path: string, plugins: IHintingModelPlugin[]) {
		const hs = new FsHintStore(path);
		await new OtdHsSupport().populateHintStore(fs.createReadStream(path), plugins, hs);
		return hs;
	}
	public async connectWrite(path: string, plugins: IHintingModelPlugin[]) {
		return new FsHintStore(path);
	}
}

class FsHintStore extends MemoryHintStore {
	constructor(private saveTo: string) {
		super();
	}
	public async commitChanges() {
		const output = fs.createWriteStream(this.saveTo);
		await new OtdHsSupport().saveHintStore(this, output);
	}
}

class OtdHsSupport {
	private hintMapToDict(map: Map<string, IHint>) {
		const dict: { [key: string]: any } = Object.create(null);
		for (const [k, v] of map) {
			dict[k] = v.toJSON();
		}
		return dict;
	}
	private stringMapToDict(map: Map<string, string>) {
		const dict: { [key: string]: string } = Object.create(null);
		for (const [k, v] of map) {
			dict[k] = v;
		}
		return dict;
	}

	public saveHintStore(hs: MemoryHintStore, output: stream.Writable) {
		const obj = {
			glyphs: this.hintMapToDict(hs.glyphHints),
			glyphHintCacheKeys: this.stringMapToDict(hs.glyphHintCacheKeys),
			sharedHints: this.hintMapToDict(hs.sharedHintTypes)
		};
		return StreamJsonZip.stringify(obj, output);
	}

	public async populateHintStore(
		input: stream.Readable,
		plugins: IHintingModelPlugin[],
		store: IHintStore
	): Promise<void> {
		const hsRep = await StreamJsonZip.parse(input);
		const hfs: IHintFactory[] = [];
		for (const plugin of plugins) {
			for (const hf of plugin.hintFactories) {
				hfs.push(hf);
			}
		}
		const hf = new EmptyImpl.FallbackHintFactory(hfs);
		for (const k in hsRep.glyphs) {
			const hint = hf.readJson(hsRep.glyphs[k], hf);
			if (hint) await store.setGlyphHints(k, hint);
		}
		for (const k in hsRep.sharedHints) {
			const hint = hf.readJson(hsRep.sharedHints[k], hf);
			if (hint) await store.setSharedHints(k, hint);
		}
		for (const k in hsRep.glyphHintCacheKeys) {
			await store.setGlyphHintsCacheKey(k, hsRep.glyphHintCacheKeys[k]);
		}
	}
}
