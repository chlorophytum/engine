import {
	RelocatablePushValue,
	RelocationScope,
	TtLabel,
	TtRelocatable
} from "@chlorophytum/hltt-next-backend";

import { TrStmt } from "./tr";

export interface GsBaseStats {
	generateRelocatableCode: boolean;
	varDimensionCount: number;
	fpgm: number;
	cvt: number;
	storage: number;
	twilights: number;
}

export interface Decl {
	readonly symbol: symbol;
	register(gs: GlobalScope): symbol;
}
export interface Def<T> extends Decl {
	computeDefinition(gs: GlobalScope): T;
}

export type ProgramRecord = [ProgramScope, TrStmt];
export type ProgramDef = Def<ProgramRecord>;

export class GlobalScope {
	constructor(bases: GsBaseStats) {
		// Initialize SP storage index and GETVARIATION arity
		this.sp = bases.generateRelocatableCode
			? new TtRelocatable(RelocationScope.Abi, Symbol("HLTT::ABI::SP"), bases.storage, 0)
			: bases.storage;
		this.getVariationArity = bases.varDimensionCount;
		// Initialize symbol tables
		this.storage = new RelocatableSymbolTable(
			RelocationScope.GlobalStorage,
			bases.generateRelocatableCode,
			1 + bases.storage
		);
		this.cvt = new RelocatableSymbolTable(
			RelocationScope.Cv,
			bases.generateRelocatableCode,
			bases.cvt
		);
		this.fpgm = new DefinesSymbolTable<ProgramDef>(
			RelocationScope.Function,
			bases.generateRelocatableCode,
			bases.fpgm
		);
		this.twilightPoints = new RelocatableSymbolTable(
			RelocationScope.Twilight,
			bases.generateRelocatableCode,
			bases.twilights
		);
	}
	public get storageStackFrameStart() {
		return this.storage.base;
	}
	public get storageStackFrameSize() {
		return this.storage.size;
	}
	public readonly sp: RelocatablePushValue;
	public readonly getVariationArity: number;
	public readonly storage: RelocatableSymbolTable;
	public readonly cvt: RelocatableSymbolTable;
	public readonly fpgm: DefinesSymbolTable<ProgramDef>;
	public readonly twilightPoints: RelocatableSymbolTable;
}

export class ProgramScope {
	constructor(public readonly global: GlobalScope, public readonly isProcedure: boolean) {}
	public get storageStackFrameSize() {
		return this.locals.size;
	}
	// Return label
	public exitLabel: null | TtLabel = null;
	// Locals: use storage, ID 0 denotes SP
	public readonly locals = new SimpleSymbolTable(0);
	// Parameters: readonly, use argument stack, starts from 0
	public readonly parameters = new SimpleSymbolTable(0);
}

// Symbol tables
export abstract class SymbolTableBase<T> {
	constructor(public readonly base: number) {
		this.m_size = base;
	}

	protected m_size: number;
	protected readonly mapping = new Map<symbol, number>();

	public get size() {
		return this.m_size;
	}
	symbols() {
		return this.mapping.keys();
	}
	haveDeclared(symbol: symbol) {
		return this.mapping.has(symbol);
	}
	declare(varSize: number, symbol: symbol) {
		this.mapping.set(symbol, this.m_size);
		this.m_size += varSize;
		return symbol;
	}

	abstract resolve(symbol: symbol): undefined | T;
}

export class SimpleSymbolTable extends SymbolTableBase<number> {
	constructor(base: number) {
		super(base);
	}

	resolve(symbol: symbol): undefined | number {
		return this.mapping.get(symbol);
	}
}

export class RelocatableSymbolTable extends SymbolTableBase<RelocatablePushValue> {
	constructor(
		private readonly scope: RelocationScope,
		protected readonly fRelocatable: boolean,
		base: number
	) {
		super(base);
	}

	resolve(symbol: symbol): undefined | RelocatablePushValue {
		const s = this.mapping.get(symbol);
		if (s != null && this.fRelocatable) {
			return new TtRelocatable(this.scope, symbol, s, 0);
		} else {
			return s;
		}
	}
}

// Symbol table with defines
export class DefinesSymbolTable<T> extends RelocatableSymbolTable {
	constructor(scope: RelocationScope, fRelocatable: boolean, base: number) {
		super(scope, fRelocatable, base);
	}
	protected readonly definitions = new Map<symbol, T>();

	enumDef(): IterableIterator<[symbol, T]> {
		return this.definitions[Symbol.iterator]();
	}
	setDef(s: symbol, d: T) {
		this.definitions.set(s, d);
	}
	getDef(s: symbol) {
		return this.definitions.get(s);
	}
}
