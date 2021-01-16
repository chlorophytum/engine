/* eslint-disable @typescript-eslint/no-explicit-any */
import * as stream from "stream";
import * as zlib from "zlib";

import { parseJsonObjectFromStream } from "./parse";
import { jsonStringifyToStream } from "./stringify";

export function stringifyJsonGz(obj: any, output: stream.Writable): Promise<void> {
	const ts = new stream.PassThrough();
	ts.pipe(zlib.createGzip()).pipe(output);
	return new Promise<void>(resolve => {
		jsonStringifyToStream(obj, ts);
		output.on("close", () => resolve());
	});
}

export function parseJsonGz(input: stream.Readable) {
	const ts = new stream.PassThrough();
	input.pipe(zlib.createGunzip()).pipe(ts);
	return parseJsonObjectFromStream(ts);
}
