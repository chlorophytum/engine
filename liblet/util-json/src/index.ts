import { parseJsonObjectFromStream } from "./parse";
import { jsonStringifyToStream } from "./stringify";

export namespace StreamJson {
	export const parse = parseJsonObjectFromStream;
	export const stringify = jsonStringifyToStream;
}
