/* eslint-disable @typescript-eslint/no-explicit-any */
import { TypeRep } from "typable";

export class PropertyBag {
	private store: Map<string, any> = new Map();
	public get<T>(ty: TypeRep<T>): undefined | T {
		return this.store.get(ty.uniqueName);
	}
	public set<T>(ty: TypeRep<T>, value: T) {
		this.store.set(ty.uniqueName, value);
	}
	public has<T>(ty: TypeRep<T>) {
		return this.store.has(ty.uniqueName);
	}
	public extend() {
		const bag = new PropertyBag();
		bag.store = new Map(this.store);
		return bag;
	}
}
