import { CPushValue } from "../ir/ir";
import { TtLabel } from "../ir/label";

export interface TtSymbol extends CPushValue {
	variableIndex: number | undefined;
	readonly size: number;
}
export interface TtScopeVariableFactory<T extends TtSymbol> {
	readonly storage: TtVariableFactory<T>;
	readonly fpgm: TtVariableFactory<T>;
	readonly cvt: TtVariableFactory<T>;
	readonly twilight: TtVariableFactory<T>;
	local: (s: ProgramScope<T>) => TtLocalScopeVariableFactory<T>;
}
export interface TtLocalScopeVariableFactory<T extends TtSymbol> {
	readonly local: TtVariableFactory<T>;
	readonly argument: TtVariableFactory<T>;
	readonly localTwilight: TtVariableFactory<T>;
}
export interface TtFunctionScopeSolver<T extends TtSymbol> {
	resolve(v: T): ProgramScope<T> | undefined;
}

export class GlobalScope<T extends TtSymbol> {
	public useStdLib: boolean = false;
	public sp: T; // #SP storage, used for recursion
	public storages: TtNamedSymbolTable<T>; // Storage
	public fpgm: TtNamedSymbolTable<T>; // FPGM
	public cvt: TtNamedSymbolTable<T>; // CVT
	public twilights: TtNamedSymbolTable<T>; // Twilight points

	constructor(private readonly svf: TtScopeVariableFactory<T>) {
		this.storages = new TtNamedSymbolTable(svf.storage);
		this.fpgm = new TtNamedSymbolTable(svf.fpgm);
		this.cvt = new TtNamedSymbolTable(svf.cvt);
		this.twilights = new TtNamedSymbolTable(svf.twilight);
		this.sp = this.storages.declare("#SP");
	}

	public funcScopeSolver: TtFunctionScopeSolver<T> = {
		resolve: () => undefined
	};
	public createProgramScope() {
		const ls = new ProgramScope<T>(this, false, this.svf.local);
		return ls;
	}
	public createFunctionScope(s: T) {
		const ls = new ProgramScope<T>(this, true, this.svf.local);
		return ls;
	}

	public assignID() {
		this.storages.assignID();
		this.fpgm.assignID();
		this.cvt.assignID();
		this.twilights.assignID();
	}
}
export class ProgramScope<T extends TtSymbol> {
	constructor(
		public readonly globals: GlobalScope<T>,
		readonly isFunction: boolean,
		SVF: (s: ProgramScope<T>) => TtLocalScopeVariableFactory<T>
	) {
		const svf = SVF(this);
		this.locals = new TtSimpleSymbolTable(svf.local);
		this.arguments = new TtSimpleSymbolTable(svf.argument);
		this.twilights = new TtSimpleSymbolTable(svf.localTwilight); // local twilight points
	}

	public locals: TtSimpleSymbolTable<T>;
	public arguments: TtSimpleSymbolTable<T>;
	public twilights: TtSimpleSymbolTable<T>;
	public returnArity: number | undefined = undefined;
	public maxStack = 0;
	public return?: TtLabel;
	public assignID() {
		if (!this.isFunction) {
			// Entry point
			this.locals.base = this.globals.storages.base + this.globals.storages.size;
		}
		this.locals.assignID();
		this.arguments.assignID();
		this.twilights.base = this.globals.twilights.base + this.globals.twilights.size;
		this.twilights.assignID();
	}
}

export type TtVariableFactory<T extends TtSymbol> = (size: number, name?: string) => T;

export class TtNamedSymbolTable<T extends TtSymbol> {
	public base: number = 0;
	private variableSize: number = 0;
	private items = new Map<string, T>();
	private locked: boolean = false;
	constructor(private readonly factory: TtVariableFactory<T>) {}
	public lock() {
		this.locked = true;
	}
	public declare(name: string, size: number = 1) {
		if (this.locked) throw new Error("Symbol table locked");
		if (name && this.items.has(name)) return this.items.get(name)!;
		const s = this.factory(size, name);
		this.items.set(name, s);
		this.variableSize += s.size;
		return s;
	}
	get size() {
		return this.variableSize;
	}
	public assignID() {
		let j = 0;
		for (const item of this.items.values()) {
			item.variableIndex = this.base + j;
			j += item.size;
		}
	}
}
export class TtSimpleSymbolTable<T extends TtSymbol> {
	public base: number = 0;
	private variableSize: number = 0;
	private items = new Set<T>();
	private locked: boolean = false;
	constructor(private readonly factory: TtVariableFactory<T>) {}
	public lock() {
		this.locked = true;
	}

	public declare(size: number = 1) {
		if (this.locked) throw new Error("Symbol table locked");
		const s = this.factory(size);
		this.items.add(s);
		this.variableSize += s.size;
		return s;
	}
	get size() {
		return this.variableSize;
	}
	public assignID() {
		let j = 0;
		for (const item of this.items) {
			item.variableIndex = this.base + j;
			j += item.size;
		}
	}
}
