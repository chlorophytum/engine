import * as JSONStream from "JSONStream";
import * as stream from "stream";
import * as stripBomStream from "strip-bom-stream";

export function parseJsonObjectFromStream(input: stream.Readable) {
	return new Promise<any>(function(resolve, reject) {
		let font: any = {};
		input
			.pipe(stripBomStream())
			.pipe(JSONStream.parse("$*"))
			.on("data", data => {
				font[data.key] = data.value;
			})
			.on("close", () => resolve(font))
			.on("error", e => reject(e));
	});
}
