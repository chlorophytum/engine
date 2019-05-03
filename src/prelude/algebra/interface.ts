// Abstract algebra interfaces

export interface Semigroup<T> {
	add(a: T, b: T): T;
}

export interface Monoid<T> extends Semigroup<T> {
	readonly neutral: T;
}

export interface Group<T> extends Monoid<T> {
	inverse(a: T): T;
	minus(a: T, b: T): T; // this.add(a, this.inverse(b))
}

export interface AbelianGroup<T> extends Group<T> {}

export interface Ring<T> extends AbelianGroup<T> {
	multiply(a: T, b: T): T;
}

export interface RingWithUnity<T> extends Ring<T> {
	readonly unity: T;
}

export interface Field<T> extends RingWithUnity<T> {
	reciprocal(a: T): T;
	divide(a: T, b: T): T;
}

export interface VectorSpace<V, S> extends AbelianGroup<V> {
	readonly scalarUnity: S;
	scale(s: S, v: V): V;
	addScale(a: V, s: S, b: V): V;
}
