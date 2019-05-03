import { Field, Monoid, VectorSpace } from "../algebra/interface";
import { Eq, Ord } from "../compare/interface";

export const Num: Field<number> & VectorSpace<number, number> & Eq<number> & Ord<number> = {
	neutral: 0,
	add(a, b) {
		return a + b;
	},
	inverse(a) {
		return -a;
	},
	minus(a, b) {
		return a - b;
	},
	multiply(a, b) {
		return a * b;
	},
	unity: 1,
	reciprocal(a) {
		return 1 / a;
	},
	divide(a, b) {
		return a / b;
	},
	scalarUnity: 1,
	scale(a, b) {
		return a * b;
	},
	addScale(a, s, b) {
		return a + s * b;
	},
	equal(a, b) {
		return a === b;
	},
	compare(a, b) {
		return a - b;
	}
};

export const Str: Monoid<string> & Eq<string> & Ord<string> = {
	neutral: "",
	add(a, b) {
		return a + b;
	},
	equal(a, b) {
		return a === b;
	},
	compare(a, b) {
		if (a < b) return -1;
		if (a > b) return 1;
		return 0;
	}
};
