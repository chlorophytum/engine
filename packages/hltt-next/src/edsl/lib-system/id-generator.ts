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
