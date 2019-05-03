export function F16D16FromNumber(x: number) {
	return BigInt(Math.round(x * 0x10000));
}
export function F16D16Mul(x: bigint, y: bigint) {
	return BigInt((x * y) >> BigInt(16));
}
export function F16D16Div(x: bigint, y: bigint) {
	return BigInt((x << BigInt(16)) / y);
}
export function F16D16ToF2D14(n: bigint) {
	return Number(BigInt.asIntN(16, (BigInt.asIntN(32, n) + BigInt(2)) >> BigInt(2))) / (1 << 14);
}
