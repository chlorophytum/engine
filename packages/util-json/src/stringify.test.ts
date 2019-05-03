import * as stream from "stream";

import test from "ava";

import { jsonStringifyToStream } from "./stringify";

function collect(stream: stream.Readable) {
	return new Promise<string>(function (resolve) {
		let string = "";
		stream.on("data", function (data) {
			string += data.toString();
		});

		stream.on("end", function () {
			resolve(string);
		});
	});
}

test("jsonStringifyToStream roundtrip", async t => {
	const obj = { a: 1, b: 2, c: [3, 4, 5] };
	const s = new stream.Transform();
	s._transform = function (chunk, encoding, done) {
		this.push(chunk);
		done();
	};
	jsonStringifyToStream(obj, s);
	const objRep = await collect(s);
	const obj1 = JSON.parse(objRep);
	t.deepEqual(obj, obj1);
});
