import test from "ava";
import * as stream from "stream";

import { parseJsonObjectFromStream } from "./parse";

test("parseJsonStream roundtrip", async t => {
	const obj = { a: 1, b: 2, c: [3, 4, 5] };
	const s = new stream.Readable();
	const promObj1 = parseJsonObjectFromStream(s);
	s.push(JSON.stringify(obj));
	s.push(null);
	const obj1 = await promObj1;

	t.deepEqual(obj, obj1);
});
