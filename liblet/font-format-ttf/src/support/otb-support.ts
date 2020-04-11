import {
	Geometry,
	Glyph,
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
	OpenTypeFontEntry,
	OpenTypeFontSource
} from "@chlorophytum/font-opentype";
import { Ot } from "ot-builder";

export class OtbFontSource extends OpenTypeFontSource<Ot.Glyph> {
	private readonly entry: OtbFontEntry;
	protected support: IOpenTypeFontSourceSupport<Ot.Glyph>;
	public readonly metadata: IFontSourceMetadata;

	constructor(font: Ot.Font, identifier: string) {
		super();
		const support = new OtbSupport(font);
		this.support = support;
		this.entry = new OtbFontEntry(support);
		this.metadata = { upm: font.head.unitsPerEm, identifier };
	}
	public readonly format: string = "OpenType/Otd";
	public async getEntries() {
		return [this.entry];
	}
}

export class OtbFontEntry extends OpenTypeFontEntry<Ot.Glyph> {
	constructor(protected support: IOpenTypeFontEntrySupport<Ot.Glyph>) {
		super();
	}
}

export class OtbSupport
	implements IOpenTypeFontEntrySupport<Ot.Glyph>, IOpenTypeFontSourceSupport<Ot.Glyph> {
	public readonly glyphSet: ISimpleGetBimap<string, Ot.Glyph>;
	public readonly cmap: ISimpleGetMap<number, Ot.Glyph>;
	private readonly cmapUvs: CmapUvsMap;
	private readonly fvarWrapper: VarWrapper;

	constructor(private readonly font: Ot.Font) {
		this.glyphSet = new GlyphSetWrapper(font);
		this.cmap = new CmapWrapper(font.cmap);
		this.cmapUvs = new CmapUvsMap(font.cmap);
		this.fvarWrapper = new VarWrapper(font);
	}

	public async getVariationDimensions() {
		return Array.from(this.fvarWrapper.keys());
	}

	public async getGlyphMasters(glyph: Ot.Glyph) {
		const mc = new MasterCollector(this.fvarWrapper);
		mc.processGlyph(glyph);
		return mc.getResults();
	}

	public async getGeometry(glyph: Ot.Glyph, instCh: null | Variation.Instance) {
		const instance = this.fvarWrapper.convertInstance(instCh);
		const evaluator = new GeometryEvaluator();
		if (glyph.geometry) {
			GeometryEvaluator.processGeometry(evaluator, glyph.geometry, instance);
		}
		const shape = evaluator.getResults();
		return shape;
	}

	public async getMetric(glyph: Ot.Glyph, instCh: null | Variation.Instance) {
		const instance = this.fvarWrapper.convertInstance(instCh);
		return {
			hStart: Ot.Var.Ops.evaluate(glyph.horizontal.start, instance),
			hEnd: Ot.Var.Ops.evaluate(glyph.horizontal.end, instance),
			vStart: Ot.Var.Ops.evaluate(glyph.vertical.start, instance),
			vEnd: Ot.Var.Ops.evaluate(glyph.vertical.end, instance)
		};
	}

	public async getCmapRelatedGlyphs(source: Ot.Glyph, codePoint: number) {
		const blob = this.cmapUvs.getBlob(codePoint);
		if (!blob) return [];
		else return Array.from(blob).map(([selector, target]) => ({ selector, target }));
	}

	public async getGsubRelatedGlyphs(srcGlyph: Ot.Glyph) {
		const relSink: GsubRelation<Ot.Glyph>[] = [];

		const gsub = this.font.gsub;
		if (!gsub) return relSink;

		for (const [sid, script] of gsub.scripts) {
			for (const [lid, lang] of script.languages) {
				const featureSet = new Set<Ot.Gsub.Feature>();
				if (lang.requiredFeature) featureSet.add(lang.requiredFeature);
				for (const feature of lang.features) featureSet.add(feature);

				for (const feature of featureSet) {
					for (const lookup of feature.lookups) {
						this.analyzeGsubSingle(sid, lid, feature.tag, lookup, srcGlyph, relSink);
						this.analyzeGsubAlternate(sid, lid, feature.tag, lookup, srcGlyph, relSink);
					}
				}
			}
		}
		return relSink;
	}

	private analyzeGsubSingle(
		script: string,
		language: string,
		feature: string,
		lookup: Ot.Gsub.Lookup,
		source: Ot.Glyph,
		sink: GsubRelation<Ot.Glyph>[]
	) {
		if (lookup.type !== Ot.Gsub.LookupType.Single) return;
		const to = lookup.mapping.get(source);
		if (to) {
			sink.push({ script, language, feature, lookupKind: "gsub_single", target: to });
		}
	}

	private analyzeGsubAlternate(
		script: string,
		language: string,
		feature: string,
		lookup: Ot.Gsub.Lookup,
		source: Ot.Glyph,
		sink: GsubRelation<Ot.Glyph>[]
	) {
		if (lookup.type !== Ot.Gsub.LookupType.Multi) return;
		const to = lookup.mapping.get(source);
		if (to) {
			for (const alt of to) {
				sink.push({
					script,
					language,
					feature,
					lookupKind: "gsub_alternate",
					target: alt
				});
			}
		}
	}
}

class MasterCollector {
	constructor(private readonly fvarWrapper: VarWrapper) {}
	private readonly masterCache = new WeakSet<Ot.Var.Master>();
	private readonly collectedMasters = new Map<string, Variation.MasterRep>();

	public processGlyph(g: Ot.Glyph) {
		this.processValue(g.horizontal.start);
		this.processValue(g.horizontal.end);
		this.processValue(g.vertical.start);
		this.processValue(g.vertical.end);
	}
	public processGeometry(g: Ot.Glyph.Geometry) {
		switch (g.type) {
			case Ot.Glyph.GeometryType.ContourSet:
				for (const c of g.contours) {
					for (const z of c) {
						this.processValue(z.x);
						this.processValue(z.y);
					}
				}
				break;
			case Ot.Glyph.GeometryType.GeometryList:
				for (const child of g.items) {
					this.processGeometry(child);
				}
				break;
			case Ot.Glyph.GeometryType.TtReference:
				if (g.to) this.processGlyph(g.to);
				break;
		}
	}
	public processValue(v: Ot.Var.Value) {
		for (const [m, delta] of Ot.Var.Ops.varianceOf(v)) {
			this.processMaster(m);
		}
	}
	private processMaster(m: Ot.Var.Master) {
		if (this.masterCache.has(m)) return;
		let mx: Variation.Master = {};
		let peak: Variation.Instance = {};
		for (const region of m.regions) {
			const axisTag = this.fvarWrapper.coGet(region.dim);
			if (!axisTag) continue;
			mx[axisTag] = { min: region.min, peak: region.peak, max: region.max };
			peak[axisTag] = region.peak;
		}
		const masterKey = JSON.stringify(
			Array.from(Object.entries(mx)).sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
		);
		if (!this.collectedMasters.has(masterKey)) {
			this.collectedMasters.set(masterKey, { peak, master: mx });
		}
		this.masterCache.add(m);
	}
	public getResults(): Array<Variation.MasterRep> {
		return Array.from(this.collectedMasters.values());
	}
}

class GeometryEvaluator {
	constructor(private readonly parent?: GeometryEvaluator, tfm?: Ot.Glyph.Transform2X3) {
		if (parent) {
			parent.children.push(this);
			this.zid = parent.zid;
			this.transformStack = [
				tfm || Ot.Glyph.Transform2X3.Neutral(),
				...parent.transformStack
			];
		} else {
			this.zid = 0;
			this.transformStack = [];
		}
	}

	private transformStack: Ot.Glyph.Transform2X3[];
	private zid: number;
	private nextPointRef() {
		if (this.parent) this.parent.nextPointRef();
		return WellKnownGeometryKind.Identity(this.zid++);
	}

	private children: GeometryEvaluator[] = [];
	private eigen: Geometry.GlyphPoint[][] = [];
	public getResults(): Glyph.Shape {
		return { eigen: this.eigen };
	}

	public static processGeometry(
		ev: GeometryEvaluator,
		geometry: Ot.Glyph.Geometry,
		instance: Ot.Var.Instance
	) {
		switch (geometry.type) {
			case Ot.Glyph.GeometryType.ContourSet:
				this.processContourSet(ev, geometry, instance);
				break;
			case Ot.Glyph.GeometryType.GeometryList:
				for (const child of geometry.items) {
					this.processGeometry(ev, child, instance);
				}
				break;
			case Ot.Glyph.GeometryType.TtReference:
				const evChild = new GeometryEvaluator(ev, geometry.transform);
				if (geometry.to && geometry.to.geometry) {
					this.processGeometry(evChild, geometry.to.geometry, instance);
				}
				break;
		}
	}

	private static processContourSet(
		ev: GeometryEvaluator,
		geometry: Ot.Glyph.ContourSet,
		instance: Ot.Var.Instance
	) {
		for (const c of geometry.contours) {
			const contour: Geometry.GlyphPoint[] = [];
			for (const z of c) {
				let zTransformed = z;
				for (const tfm of ev.transformStack) {
					zTransformed = Ot.Glyph.PointOps.applyTransform(zTransformed, tfm);
				}
				contour.push({
					x: Ot.Var.Ops.evaluate(zTransformed.x, instance),
					y: Ot.Var.Ops.evaluate(zTransformed.y, instance),
					on: zTransformed.kind === Ot.Glyph.PointType.Corner,
					references: [ev.nextPointRef()]
				});
			}
			ev.eigen.push(contour);
		}
	}
}

export class VarWrapper implements ISimpleGetBimap<string, Ot.Var.Dim> {
	public readonly forward: Map<string, Ot.Var.Dim> = new Map();
	public readonly backward: Map<Ot.Var.Dim, string> = new Map();

	constructor(font: Ot.Font) {
		if (font.fvar) {
			for (let aid = 0; aid < font.fvar.axes.length; aid++) {
				const dim = font.fvar.axes[aid].dim;
				const dimName = `${dim.tag}#${aid}`;
				this.forward.set(dimName, dim);
				this.backward.set(dim, dimName);
			}
		}
	}

	public get(key: string) {
		return this.forward.get(key);
	}
	public coGet(key: Ot.Var.Dim) {
		return this.backward.get(key);
	}
	public *[Symbol.iterator](): Iterable<[string, Ot.Var.Dim]> {
		yield* this.forward;
	}
	public keys() {
		return this.forward.keys();
	}
	public values() {
		return this.forward.values();
	}

	public convertMaster(masterCh: Variation.Master) {
		let masterRep: Ot.Var.MasterDim[] = [];
		for (const dimKey in masterCh) {
			const dim = this.get(dimKey);
			if (!dim) continue;
			const val = masterCh[dimKey];
			masterRep.push({ dim, min: val.min, peak: val.peak, max: val.max });
		}
		return Ot.Var.Create.Master(masterRep);
	}
	public convertInstance(instCh: null | Variation.Instance): Ot.Var.Instance {
		if (instCh == null) return instCh;
		const inst = new Map<Ot.Var.Dim, number>();
		for (const an in instCh) {
			const dim = this.get(an);
			if (dim) inst.set(dim, instCh[an]);
		}
		return inst;
	}
	public convertValue(mc: Ot.Var.ValueFactory, val: Variation.Variance<number>) {
		let x: Ot.Var.Value = 0;
		for (const [masterCh, delta] of val) {
			if (!masterCh) {
				x = Ot.Var.Ops.add(x, delta);
			} else {
				x = Ot.Var.Ops.add(x, mc.make([this.convertMaster(masterCh), delta]));
			}
		}
		return x;
	}
}

export class GlyphSetWrapper implements ISimpleGetBimap<string, Ot.Glyph> {
	public readonly forward: Map<string, Ot.Glyph> = new Map();
	public readonly backward: Map<Ot.Glyph, string> = new Map();

	constructor(font: Ot.Font) {
		const gOrd = font.glyphs.decideOrder();
		for (const [gid, glyph] of gOrd.entries()) {
			const name = glyph.name ? `${glyph.name}#${gid}` : `.gid#${gid}`;
			this.forward.set(name, glyph);
			this.backward.set(glyph, name);
		}
	}

	public get(key: string) {
		return this.forward.get(key);
	}
	public coGet(key: Ot.Glyph) {
		return this.backward.get(key);
	}
	public *[Symbol.iterator](): IterableIterator<[string, Ot.Glyph]> {
		yield* this.forward;
	}
	public keys() {
		return this.forward.keys();
	}
	public values() {
		return this.forward.values();
	}
}

class CmapWrapper implements ISimpleGetMap<number, Ot.Glyph> {
	private m_map = new Map<number, Ot.Glyph>();

	constructor(cmap: null | undefined | Ot.Cmap.Table) {
		if (cmap) {
			for (const [unicode, glyph] of cmap.unicode.entries()) {
				this.m_map.set(unicode, glyph);
			}
		}
	}

	public get(key: number) {
		return this.m_map.get(key);
	}
	public [Symbol.iterator](): IterableIterator<[number, Ot.Glyph]> {
		return this.m_map[Symbol.iterator]();
	}
	public keys() {
		return this.m_map.keys();
	}
	public values() {
		return this.m_map.values();
	}
}

class CmapUvsMap {
	constructor(cmap: null | undefined | Ot.Cmap.Table) {
		if (cmap) {
			for (const [unicode, selector, glyph] of cmap.vs.entries()) {
				this.set(unicode, selector, glyph);
			}
		}
	}

	private readonly store: Map<number, Map<number, Ot.Glyph>> = new Map();

	public getBlob(u: number) {
		return this.store.get(u);
	}
	public get(u: number, s: number) {
		const b = this.store.get(u);
		if (!b) return undefined;
		else return b.get(s);
	}
	public set(u: number, s: number, g: Ot.Glyph) {
		let b = this.store.get(u);
		if (!b) {
			b = new Map();
			this.store.set(u, b);
		}
		b.set(s, g);
	}
}
