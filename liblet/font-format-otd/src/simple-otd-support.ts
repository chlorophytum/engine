import {
	Geometry,
	Glyph,
	IFontSource,
	IFontSourceMetadata,
	Variation,
	WellKnownGeometryKind
} from "@chlorophytum/arch";
import {
	GsubRelation,
	IOpenTypeFontEntrySupport,
	IOpenTypeFontSourceSupport,
	ISimpleGetBimap,
	ISimpleGetMap,
	OpenTypeFontEntry
} from "@chlorophytum/font-opentype";
import { OpenTypeFontSource } from "@chlorophytum/font-opentype/lib/font-source";

function parseOtdCmapUnicode(s: string) {
	if (s[0] === "U" || s[0] === "u") {
		return parseInt(s.slice(2), 16);
	} else {
		return parseInt(s, 10);
	}
}

export class Cmap implements ISimpleGetMap<number, string> {
	private m_map = new Map<number, string>();

	constructor(obj: { [id: string]: string }) {
		for (const key in obj) {
			const unicode = parseOtdCmapUnicode(key);
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

class CmapUvsMap<T> {
	private readonly store: Map<number, Map<number, T>> = new Map();
	public getBlob(u: number) {
		return this.store.get(u);
	}
	public get(u: number, s: number) {
		const b = this.store.get(u);
		if (!b) return undefined;
		else return b.get(s);
	}
	public set(u: number, s: number, g: T) {
		let b = this.store.get(u);
		if (!b) {
			b = new Map();
			this.store.set(u, b);
		}
		b.set(s, g);
	}
}

export class OtdSupport
	implements IOpenTypeFontEntrySupport<string>, IOpenTypeFontSourceSupport<string> {
	public readonly glyphSet: ISimpleGetBimap<string, string>;
	public readonly cmap: ISimpleGetMap<number, string>;
	private readonly cmapUvs = new CmapUvsMap<string>();

	constructor(private readonly otd: any) {
		this.cmap = new Cmap(otd.cmap);
		this.glyphSet = new Glyf(otd.glyf);
		if (this.otd.cmap_uvs) {
			for (const key in this.otd.cmap_uvs) {
				const g = this.otd.cmap_uvs[key];
				const [unicode, selector] = key.split(" ").map(parseOtdCmapUnicode);
				this.cmapUvs.set(unicode, selector, g);
			}
		}
	}

	public async getVariationDimensions() {
		return [];
	}

	private getGlyphContours(gid: string, instance: null | Variation.Instance): Glyph.Geom {
		const g = this.otd.glyf[gid];
		if (!g) return [];

		let zid: number = 0;
		let c1: Geometry.GlyphPoint[][] = [];
		if (g.contours) {
			for (const c of g.contours) {
				const contour: Geometry.GlyphPoint[] = [];
				for (const z of c) {
					contour.push({
						x: z.x,
						y: z.y,
						on: z.on,
						references: [WellKnownGeometryKind.Identity(zid++)]
					});
				}
				c1.push(contour);
			}
		}
		return c1;
	}

	public async getGeometry(gid: string, instance: null | Variation.Instance) {
		// TODO: support reading references
		return { eigen: this.getGlyphContours(gid, instance) };
	}
	public async getGsubRelatedGlyphs(source: string) {
		const gsub = this.otd.GSUB;
		const relations: GsubRelation<string>[] = [];
		if (!gsub || !gsub.languages || !gsub.features || !gsub.lookups) return relations;
		for (const lid in gsub.languages) {
			const lang = gsub.languages[lid];
			if (!lang) continue;
			const fids = [
				...(lang.features || []),
				...(lang.requiredFeature ? [lang.requiredFeature] : [])
			];
			for (const fid of fids) {
				const feature = gsub.features[fid];
				if (!feature) continue;
				for (const lutId of feature) {
					const lookup = gsub.lookups[lutId];
					if (!lookup) continue;
					this.analyzeGsubSingle(lid, fid, lutId, lookup, source, relations);
					this.analyzeGsubMultiAlternate(lid, fid, lutId, lookup, source, relations);
				}
			}
		}
		return relations;
	}
	private analyzeGsubSingle(
		lid: string,
		fid: string,
		lutID: string,
		lookup: any,
		source: string,
		sink: GsubRelation<string>[]
	) {
		if (!lookup || !lookup.subtables) return;
		const [script, language] = lid.split("_");
		if (!script || !language) return;
		if (lookup.type !== "gsub_single") return;
		for (const st of lookup.subtables) {
			if (!st || !st[source]) continue;
			sink.push({
				script,
				language,
				feature: fid,
				lookupKind: "gsub_single",
				target: st[source]
			});
		}
	}
	private analyzeGsubMultiAlternate(
		lid: string,
		fid: string,
		lutID: string,
		lookup: any,
		source: string,
		sink: GsubRelation<string>[]
	) {
		if (!lookup || !lookup.subtables) return;
		const [script, language] = lid.split("_");
		if (!script || !language) return;
		if (lookup.type !== "gsub_alternate" || lookup.type !== "gsub_multiple") return;
		for (const st of lookup.subtables) {
			if (!st || !st[source]) continue;
			for (const target of st[source]) {
				sink.push({
					script,
					language,
					feature: fid,
					lookupKind: lookup.type,
					target: target
				});
			}
		}
	}

	public async getCmapRelatedGlyphs(source: string, codePoint: number) {
		const blob = this.cmapUvs.getBlob(codePoint);
		if (!blob) return [];
		else return Array.from(blob).map(([selector, target]) => ({ selector, target }));
	}
	public async getGlyphMasters(glyph: string) {
		return [];
	}
}

export class OtdFontSource extends OpenTypeFontSource<string> {
	private readonly entry: OtdFontEntry;
	protected support: IOpenTypeFontSourceSupport<string>;
	public readonly metadata: IFontSourceMetadata;

	constructor(otd: any, identifier: string) {
		super();
		const support = new OtdSupport(otd);
		this.support = support;
		this.entry = new OtdFontEntry(otd, identifier, support);
		this.metadata = { upm: otd.head.unitsPerEm, identifier };
	}
	public readonly format: string = "OpenType/Otd";
	public async getEntries() {
		return [this.entry];
	}
}

export class OtdFontEntry extends OpenTypeFontEntry<string> {
	constructor(
		otd: any,
		identifier: string,
		protected support: IOpenTypeFontEntrySupport<string>
	) {
		super();
	}
}
