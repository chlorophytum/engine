import { CPushValue } from "../asm/asm-instr";
import { TtLabel } from "../asm/label";

export interface TtSymbol extends CPushValue {
	variableIndex: number | undefined;
	readonly size: number;
}
export interface TtScopeVariableFactoryT<
	Va extends TtSymbol,
	Ar extends TtSymbol,
	Fu extends TtSymbol,
	Cv extends TtSymbol,
	Tw extends TtSymbol
> {
	readonly storage: TtVariableFactory<Va>;
	readonly fpgm: TtVariableFactory<Fu>;
	readonly cvt: TtVariableFactory<Cv>;
	readonly twilight: TtVariableFactory<Tw>;
	local: (
		s: TtProgramScopeT<Va, Ar, Fu, Cv, Tw>
	) => TtLocalScopeVariableFactoryT<Va, Ar, Fu, Cv, Tw>;
}
export interface TtLocalScopeVariableFactoryT<
	Va extends TtSymbol,
	Ar extends TtSymbol,
	Fu extends TtSymbol,
	Cv extends TtSymbol,
	Tw extends TtSymbol
> {
	readonly local: TtVariableFactory<Va>;
	readonly argument: TtVariableFactory<Ar>;
	readonly localTwilight: TtVariableFactory<Tw>;
}
export interface TtFunctionScopeSolverT<
	Va extends TtSymbol,
	Ar extends TtSymbol,
	Fu extends TtSymbol,
	Cv extends TtSymbol,
	Tw extends TtSymbol
> {
	resolve(v: TtSymbol): TtProgramScopeT<Va, Ar, Fu, Cv, Tw> | undefined;
}

export class TtGlobalScopeT<
	Va extends TtSymbol,
	Ar extends TtSymbol,
	Fu extends TtSymbol,
	Cv extends TtSymbol,
	Tw extends TtSymbol
> {
	public useStdLib: boolean = false;
	public sp: Va; // #SP storage, used for recursion
	public storages: TtNamedSymbolTable<Va>; // Storage
	public fpgm: TtNamedSymbolTable<Fu>; // FPGM
	public cvt: TtNamedSymbolTable<Cv>; // CVT
	public twilights: TtNamedSymbolTable<Tw>; // Twilight points

	constructor(private readonly svf: TtScopeVariableFactoryT<Va, Ar, Fu, Cv, Tw>) {
		this.storages = new TtNamedSymbolTable(svf.storage);
		this.fpgm = new TtNamedSymbolTable(svf.fpgm);
		this.cvt = new TtNamedSymbolTable(svf.cvt);
		this.twilights = new TtNamedSymbolTable(svf.twilight);
		this.sp = this.storages.declare("#SP");
	}

	public funcScopeSolver: TtFunctionScopeSolverT<Va, Ar, Fu, Cv, Tw> = {
		resolve: () => undefined
	};
	public createProgramScope() {
		return new TtProgramScopeT<Va, Ar, Fu, Cv, Tw>(this, false, this.svf.local);
	}
	public createFunctionScope(s: Fu) {
		return new TtProgramScopeT<Va, Ar, Fu, Cv, Tw>(this, true, this.svf.local);
	}

	public assignID() {
		this.storages.assignID();
		this.fpgm.assignID();
		this.cvt.assignID();
		this.twilights.assignID();
	}
}
export class TtProgramScopeT<
	Va extends TtSymbol,
	Ar extends TtSymbol,
	Fu extends TtSymbol,
	Cv extends TtSymbol,
	Tw extends TtSymbol
> {
	constructor(
		public readonly globals: TtGlobalScopeT<Va, Ar, Fu, Cv, Tw>,
		readonly isFunction: boolean,
		SVF: (
			s: TtProgramScopeT<Va, Ar, Fu, Cv, Tw>
		) => TtLocalScopeVariableFactoryT<Va, Ar, Fu, Cv, Tw>
	) {
		const svf = SVF(this);
		this.locals = new TtSimpleSymbolTable(svf.local);
		this.arguments = new TtSimpleSymbolTable(svf.argument);
		this.twilights = new TtSimpleSymbolTable(svf.localTwilight); // local twilight points
	}

	public locals: TtSimpleSymbolTable<Va>;
	public arguments: TtSimpleSymbolTable<Ar>;
	public twilights: TtSimpleSymbolTable<Tw>;
	public returnArity: number | undefined = undefined;
	public maxStack = 0;
	public return?: TtLabel;
	public assignID() {
		// Entry point
		if (!this.isFunction) {
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
