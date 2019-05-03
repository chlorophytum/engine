/* eslint-disable @typescript-eslint/no-explicit-any */
import { Typable } from "typable";

import { Glyph } from "./geometry";
import { PropertyBag } from "./property-bag";
import { IParallelTaskFactory, ITask } from "./tasks";
import { Variation } from "./variation";

export { Geometry, Glyph } from "./geometry";
export * from "./property-bag";
export * from "./tasks";
export { Variation } from "./variation";

/** A font format represents the format of fonts -- like TTF, Glyphs or UFO */
export interface IFontFormat {
	/** Queries the preferred final hint format */
	getFinalHintFormat(): Promise<IFinalHintFormat>;
	/** Connect to / Load a font */
	connectFont(path: string, identifier: string): Promise<null | IFontConnection>;
}

/** Represents a connection / link to a font. The font can be either a file or a
 *  network resource
 */
export interface IFontConnection {
	/** Open this font for hint analysis */
	openFontSource(): Promise<null | IFontSource<any>>;
	/** Open this font for pre-stating */
	openPreStat(pss: IFinalHintSink): Promise<null | IFinalHintPreStatAnalyzer>;
	/** Open this font for final hint integration */
	openFinalHintIntegrator(): Promise<null | IFinalHintIntegrator>;
}

/** Performs pre-instructing stat for hints, usually collects metadata from fonts */
export interface IFinalHintPreStatAnalyzer {
	preStat(): Promise<void>;
}
/** Performs final hint to font integration */
export interface IFinalHintIntegrator {
	apply(collector: IFinalHintStore, fhs: IFinalHintSinkSession): Promise<void>;
	save(output: string): Promise<void>;
}

/** A final hint format represents the format of hints stored in the fonts, like TT programs */
export interface IFinalHintFormat {
	/** Creates a sink for final hint connection */
	createFinalHintSink(): Promise<IFinalHintSink>;
}
/** The storage of final hints */
export interface IFinalHintStore extends Typable {
	readonly format: string;
}
/** The sink of final hints. A sink can process multiple fonts */
export interface IFinalHintSink extends Typable {
	readonly format: string;
	createSession(font: string, input: string, output: string): IFinalHintSinkSession;
	consolidate(): Promise<IFinalHintStore>;
}
/** A session of final hint sink, processes one font */
export interface IFinalHintSinkSession extends Typable {
	readonly format: string;
	createGlyphProgramSink(
		gid: string,
		glyphCacheKey?: null | undefined | string
	): Promise<IFinalHintProgramSink>;
	createSharedProgramSink(type: string): Promise<IFinalHintProgramSink>;
	consolidate(): void;
}
/** The final hint sink for one program */
export interface IFinalHintProgramSink extends Typable {
	readonly format: string;
	save(): void;
}

/** Represents a font used for hint analysis */
export interface IFontSource<GID> {
	readonly format: string;
	/** Get font metadata */
	readonly metadata: IFontSourceMetadata;
	/** Get dimensions of variation */
	getVariationDimensions(): Promise<ReadonlyArray<string>>;
	/** Get range and stops of this variation dimension */
	getRangeAndStopsOfVariationDimension(
		dim: string
	): Promise<ReadonlyArray<readonly [number, number]> | null | undefined>;
	/** Conversion from user variation to normalized variation.
	 *  Input datatype is explicitly chosen to be different from normalized instance
	 */
	convertUserInstanceToNormalized(
		user: Variation.UserInstance
	): Promise<Variation.Instance | null | undefined>;
	/** Conversion from user master to normalized master.
	 *  Input datatype is explicitly chosen to be different from normalized instance
	 */
	convertUserMasterToNormalized(
		user: Variation.UserMaster
	): Promise<Variation.Master | null | undefined>;
	/** Get entry points */
	getEntries(): Promise<ReadonlyArray<IFontEntry<GID>>>;
	/** Get a glyph from name */
	getGlyphFromName(name: string): Promise<GID | undefined>;
	/** Get the unique name of a glyph */
	getUniqueGlyphName(glyph: GID): Promise<string | undefined>;
	/** Get master list */
	getGlyphMasters(glyph: GID): Promise<ReadonlyArray<Variation.MasterRep>>;
	/** Get geometry */
	getGeometry(glyph: GID, instance: null | Variation.Instance): Promise<Glyph.Shape>;
	/** Get metrics */
	getMetric(glyph: GID, instance: null | Variation.Instance): Promise<Glyph.Metric>;
}
/** A font entry represents the entry point of a font,
 *  usually a character set and glyph relationship set
 */
export interface IFontEntry<GID> {
	/** Query the set of glyphs form this entry */
	getGlyphSet(): Promise<Set<GID>>;
	/** Query the set of characters of this entry */
	getCharacterSet(): Promise<Set<number>>;
	/** Query all glyphs with encodings */
	getEncodedGlyph(codePoint: number): Promise<GID | null | undefined>;
	/** Query related glyphs */
	getRelatedGlyphs(
		from: GID,
		codePoint?: number
	): Promise<Glyph.Relation<GID>[] | null | undefined>;
}
/** The metadata of fonts */
export interface IFontSourceMetadata {
	readonly identifier: string;
	readonly upm: number;
}

// Hint store
export interface IHintStoreProvider {
	connectRead(
		identifier: string,
		passes: IHintingPass,
		fontIdentifier?: string
	): Promise<IHintStore>;
	connectWrite(
		identifier: string,
		passes: IHintingPass,
		fontIdentifier?: string
	): Promise<IHintStore>;
}
export interface IHintStore {
	listGlyphs(): Promise<Iterable<string>>;
	getGlyphHints(glyph: string): Promise<IHint | null | undefined>;
	setGlyphHints(glyph: string, hint: IHint): Promise<void>;
	getGlyphHintsCacheKey(glyph: string): Promise<null | undefined | string>;
	setGlyphHintsCacheKey(glyph: string, ck: string): Promise<void>;
	listSharedTypes(): Promise<Iterable<string>>;
	getSharedHints(type: string): Promise<IHint | null | undefined>;
	setSharedHints(type: string, hint: IHint): Promise<void>;

	commitChanges(): Promise<void>;
	disconnect(): Promise<void>;
}

// Visual hints are geometry-invariant
export interface IHint {
	toJSON(): any;
	createCompiler(bag: PropertyBag, font: IFinalHintProgramSink): IHintCompiler | null | undefined;
	traverse(bag: PropertyBag, traveler: IHintTraveler): void;
}
export interface IHintTraveler {
	traverse(bag: PropertyBag, hint: IHint): void;
}
export interface IHintTraveller extends IHintTraveler {}
export interface IHintFactory {
	readonly type: string;
	readJson(json: any, general: IHintFactory): IHint | null | undefined;
}
export interface IHintCompiler {
	doCompile(): void;
}

// Shape analysis (auto hinting)
export interface IHintingModelExecEnv {
	/// Font index
	readonly fontIndex: number;
	/// Quantity of fonts
	readonly totalFonts: number;
	/// Model-local hint store
	readonly hintStore: IHintStore;
	/// Global cache manager
	readonly cacheManager: IHintCacheManager;
	/// Global hint factory
	readonly hintFactory: IHintFactory;
	/// Property bag carried over hinting passes
	readonly carry: PropertyBag;
}
export interface IHintingModelPreEnv {
	/// Round
	readonly round: number;
	/// Font index
	readonly fontIndex: number;
	/// Quantity of fonts
	readonly totalFonts: number;
	/// Property bag carried over hinting passes
	readonly carry: PropertyBag;
}
export interface IHintCacheManager {
	getCache(ck: string): null | undefined | IHint;
	setCache(ck: string, hints: IHint): void;
}
export interface IHintingModel {
	readonly type: string;
	getPreTask?(env: IHintingModelPreEnv): null | ITask<unknown>;
	getHintingTask(env: IHintingModelExecEnv): null | ITask<unknown>;
}
export interface IHintingPass extends IParallelTaskFactory {
	readonly requirePreHintRounds: number;
	readonly factoriesOfUsedHints: ReadonlyArray<IHintFactory>;
	adopt<GID>(font: IFontSource<GID>): IHintingModel | null | undefined;
}

// Hint compilation (instructing)

// Logging
export interface ILogger {
	bullet(prefix: string): ILogger;
	indent(prefix: string): ILogger;
	log(what: string): void;
}
