import { TtLabel } from "../asm/label";

import { Def } from "./decl";

export interface GlobalScopeBase {
	varDimensionCount: number;
	fpgm: number;
	cvt: number;
	storage: number;
	twilights: number;
}

export class GlobalScope {
	constructor(bases: GlobalScopeBase) {
		this.storage = new SimpleSymbolTable(1 + bases.storage);
		this.sp = bases.storage;
		this.cvt = new SimpleSymbolTable(bases.cvt);
		this.functions = new DefinesSymbolTable(bases.fpgm);
		this.getVariationArity = bases.varDimensionCount;
	}
	public get storageStackFrameStart() {
		return this.storage.base;
	}
	public get storageStackFrameSize() {
		return this.storage.size;
	}
	public readonly sp: number;
	public readonly getVariationArity: number;
	public readonly storage: SimpleSymbolTable;
	public readonly cvt: SimpleSymbolTable;
	public readonly functions: DefinesSymbolTable<Def>;
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
export class SimpleSymbolTable {
	constructor(public readonly base: number) {
		this.m_size = base;
	}

	private m_size: number;
	private readonly mapping = new Map<symbol, number>();

	public get size() {
		return this.m_size;
	}
	haveDeclared(symbol: symbol) {
		return this.mapping.has(symbol);
	}
	declare(varSize: number, symbol: symbol) {
		this.mapping.set(symbol, this.m_size);
		this.m_size += varSize;
		return symbol;
	}

	resolve(symbol: symbol) {
		return this.mapping.get(symbol);
	}
}

// Symbol table with defines
export class DefinesSymbolTable<T> {
	constructor(public readonly base: number) {
		this.m_size = base;
	}

	private m_size: number;
	private readonly mapping = new Map<symbol, number>();
	private readonly definitions = new Map<symbol, T>();

	public get size() {
		return this.m_size;
	}
	haveDeclared(symbol: symbol) {
		return this.mapping.has(symbol);
	}
	declare(varSize: number, symbol: symbol) {
		this.mapping.set(symbol, this.m_size);
		this.m_size += varSize;
		return symbol;
	}
	resolve(symbol: symbol) {
		return this.mapping.get(symbol);
	}

	enumDef(): IterableIterator<[symbol, T]> {
		return this.definitions[Symbol.iterator]();
	}
	setDef(s: symbol, d: T) {
		this.definitions.set(s, d);
	}
	getDef(s: symbol, d: T) {
		this.definitions.get(s);
	}
}
