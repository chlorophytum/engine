import {
	EmptyImpl,
	GlyphGeometry,
	GlyphPoint,
	IFontSourceMetadata,
	IHint,
	IHintFactory,
	IHintingModelPlugin,
	IHintStore
} from "@chlorophytum/arch";
import {
	IOpenTypeFileSupport,
	IOpenTypeHsSupport,
	ISimpleGetBimap,
	ISimpleGetMap,
	OpenTypeFont,
	OpenTypeVariation
} from "@chlorophytum/font-opentype";
import { StreamJson } from "@chlorophytum/util-json";
import * as stream from "stream";
import * as zlib from "zlib";

export class Cmap implements ISimpleGetMap<number, string> {
	private m_map = new Map<number, string>();

	constructor(obj: { [id: string]: string }) {
		for (const key in obj) {
			const unicode = parseInt(key);
			if (unicode) this.m_map.set(unicode, obj[key]);
		}
	}

	public get(key: number) {
		return this.m_map.get(key);
	}
	public [Symbol.iterator](): Iterable<[number, string]> {
		return this.m_map[Symbol.iterator]();
	}
	public keys() {
		return this.m_map.keys();
	}
	public values() {
		return this.m_map.values();
	}
}
export class Glyf implements ISimpleGetBimap<string, string> {
	private m_map = new Set<string>();

	constructor(obj: { [id: string]: any }) {
		for (const key in obj) this.m_map.add(key);
	}

	public get(key: string) {
		if (this.m_map.has(key)) return key;
		return undefined;
	}
	public coGet(key: string) {
		return this.get(key);
	}
	public *[Symbol.iterator](): Iterable<[string, string]> {
		for (const k of this.m_map) yield [k, k];
	}
	public keys() {
		return this.m_map.keys();
	}
	public values() {
		return this.m_map.values();
	}
}

export class OtdSupport implements IOpenTypeFileSupport<string> {
	public readonly glyphSet: ISimpleGetBimap<string, string>;
	public readonly cmap: ISimpleGetMap<number, string>;

	constructor(private readonly otd: any) {
		this.cmap = new Cmap(otd.cmap);
		this.glyphSet = new Glyf(otd.glyf);
	}

	private getGlyphContours(gid: string, instance: null | OpenTypeVariation): GlyphGeometry {
		const g = this.otd.glyf[gid];
		if (!g) return [];

		let zid: number = 0;
		let c1: GlyphPoint[][] = [];
		if (g.contours) {
			for (const c of g.contours) {
				const contour: GlyphPoint[] = [];
				for (const z of c) contour.push({ x: z.x, y: z.y, on: z.on, id: zid++ });
				c1.push(contour);
			}
		}
		return c1;
	}

	public async getGeometry(gid: string, instance: null | OpenTypeVariation) {
		return { eigen: this.getGlyphContours(gid, instance) };
	}
	public async getGsubRelatedGlyphs(source: string) {
		return [];
	}
	public async getGlyphMasters(glyph: string) {
		return [];
	}

	public readonly hsSupport = new OtdHsSupport();
}

function stringifyJsonGz(obj: any, output: stream.Writable): Promise<void> {
	const ts = new stream.PassThrough();
	ts.pipe(zlib.createGzip()).pipe(output);
	return new Promise<void>(resolve => {
		StreamJson.stringify(obj, ts);
		output.on("close", () => resolve());
	});
}

async function parseJsonGz(input: stream.Readable) {
	const ts = new stream.PassThrough();
	input.pipe(zlib.createGunzip()).pipe(ts);
	return await StreamJson.parse(ts);
}

export class OtdHsSupport implements IOpenTypeHsSupport {
	private hintMapToDict(map: Map<string, IHint>) {
		const dict: { [key: string]: any } = Object.create(null);
		for (const [k, v] of map) {
			dict[k] = v.toJSON();
		}
		return dict;
	}

	public saveHintStore(
		glyphHints: Map<string, IHint>,
		sharedHints: Map<string, IHint>,
		output: stream.Writable
	) {
		const obj = {
			glyphs: this.hintMapToDict(glyphHints),
			sharedHints: this.hintMapToDict(sharedHints)
		};
		return stringifyJsonGz(obj, output);
	}

	public async populateHintStore(
		input: stream.Readable,
		plugins: IHintingModelPlugin[],
		store: IHintStore
	): Promise<void> {
		const hsRep = await parseJsonGz(input);
		const hfs: IHintFactory[] = [];
		for (const plugin of plugins) {
			for (const hf of plugin.hintFactories) {
				hfs.push(hf);
			}
		}
		const hf = new EmptyImpl.FallbackHintFactory(hfs);
		for (const k in hsRep.glyphs) {
			const hint = hf.readJson(hsRep.glyphs[k], hf);
			if (hint) store.setGlyphHints(k, hint);
		}
		for (const k in hsRep.sharedHints) {
			const hint = hf.readJson(hsRep.sharedHints[k], hf);
			if (hint) store.setSharedHints(k, hint);
		}
	}
}

export class OtdFontSource extends OpenTypeFont<string> {
	public readonly format: string = "OpenType/Otd";
	public readonly metadata: IFontSourceMetadata;
	protected support: IOpenTypeFileSupport<string>;

	constructor(otd: any, identifier: string) {
		super();
		this.support = new OtdSupport(otd);
		this.metadata = { upm: otd.head.unitsPerEm, identifier };
	}
}
