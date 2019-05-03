export type Identifiable = number | string | { readonly id: string };
export function createIdentifier<IDs extends Identifiable[]>(ids: IDs) {
	let id = "";
	for (const item of ids) {
		if (id) id += ",";
		if (typeof item === "number" || typeof item === "string") id += String(item);
		else id += item.id;
	}
	return id;
}
export function Template<IDs extends Identifiable[], R>(fnDef: (...ids: IDs) => R) {
	const cache = new Map<string, R>();
	return function (...ids: IDs): R {
		const key = createIdentifier(ids);
		const cached = cache.get(key);
		if (cached) return cached;
		const computed = fnDef(...ids);
		cache.set(key, computed);
		return computed;
	};
}
