export interface MultipleAlignZoneMeta {
	gapMinDist: number[]; // N+1 args
	inkMinDist: number[]; // N args
	recPath: number[]; // N args
	bottomFree: boolean; // 1 arg
	topFree: boolean; // 1 arg
}

export interface MultipleAlignZoneProps extends MultipleAlignZoneMeta {
	bottomPoint: number; // 1 arg
	topPoint: number; // 1 arg
	middleStrokes: [number, number][]; // 2N args
	mergePriority: number[]; // N+1 items. Not an argument!
}

function drop<A>(a: A[], index: number) {
	let a1: A[] = [];
	for (let j = 0; j < a.length; j++) if (j !== index) a1.push(a[j]);
	return a1;
}

function decideMerge(allowMerge: number[], N: number) {
	let mergeIndex = -1;
	let mergePri = 0;
	for (let j = 0; j <= N; j++) {
		const a = allowMerge[j] || 0;
		if (Math.abs(a) > Math.abs(mergePri)) {
			mergeIndex = j;
			mergePri = a;
		}
	}
	let mergeDown = mergePri < 0 ? 1 : 0;
	return { mergeIndex, mergeDown };
}

function getRecPathImpl(a: number[], N: number): number[] {
	const { mergeIndex, mergeDown } = decideMerge(a, N);
	const pri = (1 + mergeIndex) * (mergeDown ? -1 : 1);
	if (mergeIndex < 0) {
		return [];
	} else if (mergeIndex === 0) {
		return [pri, ...getRecPathImpl(drop(a, 0), N - 1)];
	} else if (mergeIndex === N) {
		return [pri, ...getRecPathImpl(drop(a, N - 1), N - 1)];
	} else if (mergeDown) {
		return [pri, ...getRecPathImpl(drop(a, mergeIndex), N - 1)];
	} else {
		return [pri, ...getRecPathImpl(drop(a, mergeIndex - 1), N - 1)];
	}
}

export function getRecPath(a: number[], N: number) {
	let a1 = getRecPathImpl(a, N);
	while (a1.length < N) a1.push(0);
	a1.length = N;
	return a1;
}
