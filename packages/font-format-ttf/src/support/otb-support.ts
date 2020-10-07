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
	isOtVarMaster,
	OpenTypeFontEntry,
	OpenTypeFontSource,
	OtVarMaster,
	OtVarMasterDR
} from "@chlorophytum/font-opentype";
import { Ot } from "ot-builder";
import { F16D16Div, F16D16FromNumber, F16D16Mul, F16D16ToF2D14 } from "../normalization";

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

	public getVariationDimensions() {
		return Array.from(this.fvarWrapper.keys());
	}
	public getRangeAndStopsOfVariationDimension(dim: string) {
		return this.fvarWrapper.getRangeAndStops(dim);
	}
	public convertUserInstanceToNormalized(user: Variation.UserInstance) {
		return this.fvarWrapper.convertUserInstanceToNormalized(user);
	}
	public convertUserMasterToNormalized(user: Variation.UserMaster) {
		return this.fvarWrapper.convertUserMasterToNormalized(user);
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
	private readonly collectedMasters = new Map<string, Variation.MasterRep<OtVarMaster>>();

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
		let peak: { [axis: string]: number } = {};
		let mx: { [axis: string]: OtVarMasterDR } = {};
		for (const region of m.regions) {
			const axisTag = this.fvarWrapper.coGetDim(region.dim);
			if (!axisTag) continue;
			mx[axisTag] = { min: region.min, peak: region.peak, max: region.max };
			peak[axisTag] = region.peak;
		}
		const masterKey = JSON.stringify(
			Array.from(Object.entries(mx)).sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
		);
		if (!this.collectedMasters.has(masterKey)) {
			this.collectedMasters.set(masterKey, { peak, master: { otVar: mx } });
		}
		this.masterCache.add(m);
	}
	public getResults(): Array<Variation.MasterRep<OtVarMaster>> {
		return Array.from(this.collectedMasters.values());
	}
}

class GeometryEvaluator {
	constructor(private readonly parent?: GeometryEvaluator, tfm?: Ot.Glyph.Transform2X3) {
		if (parent) {
			parent.children.push(this);
			this.zid = parent.zid;
			this.transformStack = [tfm || Ot.Glyph.Transform2X3.Identity, ...parent.transformStack];
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

export class VarWrapper implements ISimpleGetBimap<string, Ot.Fvar.Axis> {
	public readonly avar: Map<string, readonly (readonly [number, number])[]> = new Map();
	public readonly forward: Map<string, Ot.Fvar.Axis> = new Map();
	public readonly backward: Map<Ot.Fvar.Axis, string> = new Map();
	public readonly backwardDim: Map<Ot.Var.Dim, string> = new Map();

	constructor(font: Ot.Font) {
		if (font.fvar) {
			for (let aid = 0; aid < font.fvar.axes.length; aid++) {
				const axis = font.fvar.axes[aid];
				const dimName = `${axis.dim.tag}#${aid}`;
				this.forward.set(dimName, axis);
				this.backward.set(axis, dimName);
				this.backwardDim.set(axis.dim, dimName);
			}
		}
		if (font.avar) {
			for (const [dim, segMap] of font.avar.segmentMaps) {
				const b = this.backwardDim.get(dim);
				if (!b) continue;
				this.avar.set(b, segMap);
			}
		}
	}

	public get(key: string) {
		return this.forward.get(key);
	}
	public coGet(key: Ot.Fvar.Axis) {
		return this.backward.get(key);
	}
	public coGetDim(key: Ot.Var.Dim) {
		return this.backwardDim.get(key);
	}
	public *[Symbol.iterator](): Iterable<[string, Ot.Fvar.Axis]> {
		yield* this.forward;
	}
	public keys() {
		return this.forward.keys();
	}
	public values() {
		return this.forward.values();
	}

	public getRangeAndStops(key: string): null | readonly (readonly [number, number])[] {
		const axis = this.get(key);
		if (!axis) return null;
		let a: (readonly [number, number])[] = [];
		if (axis.dim.min < axis.dim.default) a.push([axis.dim.min, -1]);
		a.push([axis.dim.default, 0]);
		if (axis.dim.max > axis.dim.default) a.push([axis.dim.max, +1]);
		return a;
	}

	// User to CH
	private calcDefaultNormalizationValue(key: string, userValue: number) {
		const axis = this.get(key);
		if (!axis) return 0;
		const nUser = F16D16FromNumber(userValue),
			nMin = F16D16FromNumber(axis.dim.min),
			nDefault = F16D16FromNumber(axis.dim.default),
			nMax = F16D16FromNumber(axis.dim.max);
		if (nUser < nDefault) {
			return Math.max(-1, F16D16ToF2D14(F16D16Div(-(nDefault - nUser), nDefault - nMin)));
		} else if (nUser > nDefault) {
			return Math.max(-1, F16D16ToF2D14(F16D16Div(nUser - nDefault, nMax - nDefault)));
		}
		return 0;
	}
	private normalizeUserAxisValue(key: string, userValue: number) {
		const axis = this.get(key);
		if (!axis) return 0;
		let normalized = this.calcDefaultNormalizationValue(key, userValue);
		const segMap = this.avar.get(key);
		if (segMap) {
			const nNormalized = F16D16FromNumber(normalized);
			for (let k = 1; k < segMap.length; k++) {
				const nOrigK = F16D16FromNumber(segMap[k][0]);
				if (nOrigK === nNormalized) return normalized;
				if (nOrigK > nNormalized) {
					const nOrigKm1 = F16D16FromNumber(segMap[k - 1][0]);
					const nAfterKm1 = F16D16FromNumber(segMap[k - 1][1]);
					const nAfterK = F16D16FromNumber(segMap[k][1]);
					const p = F16D16Div(nNormalized - nOrigKm1, nOrigK - nOrigKm1);
					const nAfter = nAfterKm1 + F16D16Mul(nAfterK - nAfterKm1, p);
					return F16D16ToF2D14(nAfter);
				}
			}
		}
		return normalized;
	}
	public convertUserInstanceToNormalized(user: Variation.UserInstance): Variation.Instance {
		const normalized: { [axis: string]: number } = {};
		for (const k in user.user) {
			normalized[k] = this.normalizeUserAxisValue(k, user.user[k]);
		}
		return normalized;
	}
	public convertUserMasterToNormalized(user: Variation.UserMaster): null | OtVarMaster {
		if (!isOtVarMaster(user.user)) {
			return null;
		}
		const normalized: { [axis: string]: OtVarMasterDR } = {};
		for (const k in user.user.otVar) {
			const d = user.user.otVar[k];
			normalized[k] = {
				min: this.normalizeUserAxisValue(k, d.min),
				peak: this.normalizeUserAxisValue(k, d.peak),
				max: this.normalizeUserAxisValue(k, d.max)
			};
		}
		return { otVar: normalized };
	}

	// CH to underlying
	public convertMaster(masterCh: Variation.Master) {
		if (!isOtVarMaster(masterCh)) return null;
		let masterRep: Ot.Var.MasterDim[] = [];
		for (const dimKey in masterCh.otVar) {
			const axis = this.get(dimKey);
			if (!axis) continue;
			const val = masterCh.otVar[dimKey];
			masterRep.push({ dim: axis.dim, min: val.min, peak: val.peak, max: val.max });
		}
		return new Ot.Var.Master(masterRep);
	}
	public convertInstance(instCh: null | Variation.Instance): Ot.Var.Instance {
		if (instCh == null) return instCh;
		const inst = new Map<Ot.Var.Dim, number>();
		for (const an in instCh) {
			const axis = this.get(an);
			if (axis) inst.set(axis.dim, instCh[an]);
		}
		return inst;
	}
	public convertValue(mc: Ot.Var.ValueFactory, val: Variation.Variance<number>) {
		let x: Ot.Var.Value = 0;
		for (const [masterCh, delta] of val) {
			if (!masterCh) {
				x = Ot.Var.Ops.add(x, delta);
			} else {
				const m = this.convertMaster(masterCh);
				if (m) x = Ot.Var.Ops.add(x, mc.make([m, delta]));
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
