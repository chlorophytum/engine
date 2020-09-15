import { parseJsonGz, stringifyJsonGz } from "./json-gz";
import { parseJsonObjectFromStream } from "./parse";
import { jsonStringifyToStream } from "./stringify";

export namespace StreamJson {
	export const parse = parseJsonObjectFromStream;
	export const stringify = jsonStringifyToStream;
}

export namespace StreamJsonZip {
	export const parse = parseJsonGz;
	export const stringify = stringifyJsonGz;
}
