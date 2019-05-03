import { TtfInstr, TtfIR, TtfSymbolTable } from "../ir";

export class TtfAllocator<T> {
	constructor(private readonly prefix: string) {}
	base: number = 0;
	private items: Map<string, T> = new Map();

	get(k: string) {
		return this.items.get(k);
	}
	set(k: string, v: T) {
		return this.items.set(k, v);
	}
	setIfAbsent(k: string, v: () => T) {
		if (!this.items.has(k)) this.items.set(k, v());
	}

	ref(name: string) {
		return this.prefix + name;
	}
	createSymbolTable() {
		let st: TtfSymbolTable = Object.create(null);
		for (const [key, index, value] of this.entries()) {
			st[this.ref(key)] = index;
		}
		return st;
	}
	*entries(): IterableIterator<[string, number, T]> {
		let rawIndex = 0;
		for (const [key, value] of this.items) {
			yield [key, this.base + rawIndex, value];
			rawIndex++;
		}
	}
}

// CV is the CVT format -- either number of "variable quantities" for VFs
export class TtfContext<CV> {
	fdef: TtfAllocator<TtfIR>;
	storage: TtfAllocator<void>;
	cvt: TtfAllocator<CV>;

	constructor(parent?: TtfContext<CV>) {
		if (parent) {
			this.fdef = parent.fdef;
			this.storage = parent.storage;
			this.cvt = parent.cvt;
		} else {
			this.fdef = new TtfAllocator<TtfIR>(`Global::FDEF::`);
			this.storage = new TtfAllocator<void>(`Global::Storage::`);
			this.cvt = new TtfAllocator<CV>(`Global::CVT::`);
		}
	}
}

export class TtfIRContext<CV> extends TtfContext<CV> {
	private program: TtfInstr[] = [];

	label(l: string) {
		return `Local::Labels::${l}`;
	}

	getResults(): TtfIR {
		let labels: TtfSymbolTable = Object.create(null);
		let offset = 0;
		for (const ir of this.program) {
			if (ir.label) labels[this.label(ir.label)] = offset;
			offset += ir.size;
		}
		return {
			localSymbols: labels,
			instructions: this.program
		};
	}

	add(...items: TtfInstr[]) {
		for (const item of items) {
			this.program.push(item);
		}
	}
}
