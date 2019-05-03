export interface Eq<T> {
	equal(a: T, b: T): boolean;
}

export interface Ord<T> {
	compare(a: T, b: T): number;
}
