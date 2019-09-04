export namespace WellKnownGlyphRelation {
	export interface Pattern<A extends any[]> {
		apply(...a: A): string;
		unApply(x: string): null | A;
	}

	export const UnicodeVariant: Pattern<[number]> = {
		apply(x: number) {
			return `UnicodeVariant ${x}`;
		},
		unApply(x: string) {
			const m = x.match(/^UnicodeVariant (\d+)$/);
			if (m) return [parseInt(m[1], 10)];
			else return null;
		}
	};

	export const Gsub: Pattern<[string, string, string, string]> = {
		apply(script: string, lang: string, feature: string, lookupKind: string) {
			return `Gsub ${script.trim()} ${lang.trim()} ${feature.trim()} ${lookupKind.trim()}`;
		},
		unApply(x: string) {
			const m = x.match(/^Gsub (\w+)\s+(\w+)\s+(\w+)\s+(\w+)$/);
			if (m) return [m[1], m[2], m[3], m[4]];
			else return null;
		}
	};
}
