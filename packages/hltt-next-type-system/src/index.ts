// EDSLv2 type system
export type TT =
	| TNumeric
	| THandle
	| Bool
	| { readonly kind: "Store"; readonly id: string; readonly member: TT } // = Store<TT>
	| { readonly kind: "Cvt"; readonly id: string; readonly member: TT }; // = Cvt<TT>

// General types
export type TArith = Int | Frac;
export type TNumeric = Int | Frac | UniFrac;
export type THandle = GlyphPoint | TwilightPoint;

// Specific types
// Integer (Int32)
export type Int = { readonly kind: "Int"; readonly id: "Int" };
export const Int: Int = { kind: "Int", id: "Int" };

// Fraction (26.6)
export type Frac = { readonly kind: "Frac"; readonly id: "Frac" };
export const Frac: Frac = { kind: "Frac", id: "Frac" };

// UniFrac (2.14), no arith for now
export type UniFrac = { readonly kind: "UniFrac"; readonly id: "UniFrac" };
export const UniFrac: UniFrac = { kind: "UniFrac", id: "UniFrac" };

// Boolean
export type Bool = { readonly kind: "Bool"; readonly id: "Bool" };
export const Bool: Bool = { kind: "Bool", id: "Bool" };

// Glyph point
export type GlyphPoint = { readonly kind: "GlyphPoint"; readonly id: "GlyphPoint" };
export const GlyphPoint: GlyphPoint = { kind: "GlyphPoint", id: "GlyphPoint" };

// Twilight Point
export type TwilightPoint = { readonly kind: "TwilightPoint"; readonly id: "TwilightPoint" };
export const TwilightPoint: TwilightPoint = { kind: "TwilightPoint", id: "TwilightPoint" };

export type Store<T extends TT> = {
	readonly kind: "Store";
	readonly id: string;
	readonly member: T;
};
export function Store<T extends TT>(x: T): Store<T> {
	return { kind: "Store", id: `Store(${x.id})`, member: x };
}

export type Cvt<T extends TT> = { readonly kind: "Cvt"; readonly id: string; readonly member: T };
export function Cvt<T extends TT>(x: T): Cvt<T> {
	return { kind: "Cvt", id: `Cvt(${x.id})`, member: x };
}
