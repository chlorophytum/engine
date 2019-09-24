export class TypeRep<T> {
	constructor(readonly id: string) {}
	public suffix(suffix: string) {
		return new TypeRep<T>(this.id + "::" + suffix);
	}
}

export class PropertyBag {
	private store: Map<string, any> = new Map();
	public get<T>(ty: TypeRep<T>): undefined | T {
		return this.store.get(ty.id);
	}
	public set<T>(ty: TypeRep<T>, value: T) {
		this.store.set(ty.id, value);
	}
	public has<T>(ty: TypeRep<T>) {
		return this.store.has(ty.id);
	}
	public extend() {
		const bag = new PropertyBag();
		bag.store = new Map(this.store);
		return bag;
	}
}
