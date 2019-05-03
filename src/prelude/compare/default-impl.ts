import { Ord } from "./interface";

export class FiniteListOrd<T> implements Ord<ReadonlyArray<T>> {
	constructor(private readonly elementOrd: Ord<T>) {}
	compare(a: ReadonlyArray<T>, b: ReadonlyArray<T>) {
		let j = 0;
		for (; j < a.length && j < b.length; j++) {
			const cmp = this.elementOrd.compare(a[j], b[j]);
			if (cmp) return cmp;
		}
		if (j < a.length) return 1;
		if (j < b.length) return -1;
		return 0;
	}
}
