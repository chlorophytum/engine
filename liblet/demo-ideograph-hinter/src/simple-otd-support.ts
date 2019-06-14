import { GlyphGeometry, GlyphPoint, IFontSourceMetadata } from "@chlorophytum/arch";
import {
	IOpenTypeFileSupport,
	ISimpleGetBimap,
	ISimpleGetMap,
	OpenTypeFont,
	OpenTypeVariation
} from "@chlorophytum/font-opentype";

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
}

export class OtdFontSource extends OpenTypeFont<string> {
	public readonly format: string = "OpenType/Otd";
	public readonly metadata: IFontSourceMetadata;
	protected support: IOpenTypeFileSupport<string>;

	constructor(otd: any) {
		super();
		this.support = new OtdSupport(otd);
		this.metadata = { upm: otd.head.unitsPerEm };
	}
}
