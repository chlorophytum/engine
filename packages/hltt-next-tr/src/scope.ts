import {
	RelocatablePushValue,
	RelocationScope,
	TtLabel,
	TtRelocatable
} from "@chlorophytum/hltt-next-backend";

import { TrStmt } from "./tr";

export interface GsOptions {
	generateRelocatableCode: boolean;
	stackPointerStorageID: number;
}

export interface GsStats {
	varDimensionCount: number;
	fpgmBase: number;
	cvtBase: number;
	storageBase: number;
	twilightsBase: number;
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
	constructor(
		private readonly options: GsOptions,
		stats: GsStats
	) {
		if (stats.storageBase <= options.stackPointerStorageID)
			throw new Error("Unreachable! stoage base <= #HLTT::ABI::SP");

		// SP storage index
		this.sp = options.generateRelocatableCode
			? new TtRelocatable(
					RelocationScope.Abi,
					Symbol("HLTT::ABI::SP"),
					options.stackPointerStorageID,
					0
				)
			: options.stackPointerStorageID;

		// GETVARIATION arity
		this.getVariationArity = stats.varDimensionCount;

		// Symbol tables
		this.storage = new RelocatableSymbolTable(
			RelocationScope.GlobalStorage,
			options.generateRelocatableCode,
			stats.storageBase
		);
		this.cvt = new RelocatableSymbolTable(
			RelocationScope.Cv,
			options.generateRelocatableCode,
			stats.cvtBase
		);
		this.fpgm = new DefinesSymbolTable<ProgramDef>(
			RelocationScope.Function,
			options.generateRelocatableCode,
			stats.fpgmBase
		);
		this.twilightPoints = new RelocatableSymbolTable(
			RelocationScope.Twilight,
			options.generateRelocatableCode,
			stats.twilightsBase
		);
	}
	public getVolatileZoneStartValue() {
		// Note: the value below is accurate if and only if all programs are consolidated
		//       since it depends on the total length of the global storages
		if (this.options.generateRelocatableCode) {
			return new TtRelocatable(
				RelocationScope.Abi,
				Symbol("HLTT::ABI::VolatileStorageStart"),
				this.storage.base + this.storage.size,
				0
			);
		} else {
			return this.storage.base + this.storage.size;
		}
	}
	public lockSymbolTables() {
		this.storage.lock();
		this.cvt.lock();
		this.fpgm.lock();
		this.twilightPoints.lock();
	}
	public readonly sp: RelocatablePushValue;
	public readonly getVariationArity: number;
	public readonly storage: RelocatableSymbolTable;
	public readonly cvt: RelocatableSymbolTable;
	public readonly fpgm: DefinesSymbolTable<ProgramDef>;
	public readonly twilightPoints: RelocatableSymbolTable;
}

export class ProgramScope {
	constructor(
		public readonly global: GlobalScope,
		public readonly isProcedure: boolean
	) {}
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

	protected m_locked = false;
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

	lock() {
		this.m_locked = true;
	}
	declare(varSize: number, symbol: symbol) {
		if (this.m_locked) throw new Error("Unreachable: Symbol table locked");
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
