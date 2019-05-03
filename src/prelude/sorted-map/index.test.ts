import test from "ava";

import { Ord } from "../compare/interface";

import { SortedMap } from ".";

type Key = [number, number];
const ordKey: Ord<Key> = {
	compare(a: Key, b: Key) {
		if (a[0] < b[0]) return -1;
		if (a[0] > b[0]) return +1;
		return a[1] - b[1];
	}
};

test("Sorted map test", t => {
	const sm = new SortedMap<Key, number>(16, ordKey);
	sm.set([0, 1], 2);
	sm.set([0, 0], 1);
	sm.set([1, 1], 3);
	t.deepEqual([...sm], [[[0, 0], 1], [[0, 1], 2], [[1, 1], 3]]);
	sm.set([1, 1], 5);
	t.deepEqual([...sm], [[[0, 0], 1], [[0, 1], 2], [[1, 1], 5]]);
	sm.delete([0, 1]);
	t.deepEqual([...sm], [[[0, 0], 1], [[1, 1], 5]]);
	t.is(sm.get([0, 0]), 1);
	t.is(sm.get([1, 1]), 5);
});
