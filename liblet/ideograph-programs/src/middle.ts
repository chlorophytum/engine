import {
	EdslFunctionTemplate,
	ProgramDsl,
	Statement,
	TemplateEx,
	Variable
} from "@chlorophytum/hltt";

import { TInitMD, TInitRecPath, TInitZMids } from "./middle-array";
import { THintMultipleStrokesMainImpl } from "./middle-main";
import { HintMultipleStrokesGiveUp } from "./simple";
import {
	CollideDownTwoStrokes,
	CollideHangBottom,
	CollideHangTop,
	CollideUpTwoStrokes
} from "./stroke-omit";

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

function getRecPath(a: number[], N: number): number[] {
	const { mergeIndex, mergeDown } = decideMerge(a, N);
	const pri = (1 + mergeIndex) * (mergeDown ? -1 : 1);
	if (mergeIndex < 0) {
		return [];
	} else if (mergeIndex === 0) {
		return [pri, ...getRecPath(drop(a, 0), N - 1)];
	} else if (mergeIndex === N) {
		return [pri, ...getRecPath(drop(a, N - 1), N - 1)];
	} else if (mergeDown) {
		return [pri, ...getRecPath(drop(a, mergeIndex), N - 1)];
	} else {
		return [pri, ...getRecPath(drop(a, mergeIndex - 1), N - 1)];
	}
}

function drop<A>(a: A[], index: number) {
	let a1: A[] = [];
	for (let j = 0; j < a.length; j++) if (j !== index) a1.push(a[j]);
	return a1;
}

function dropMidList<A>(a: A[], index: number, N: number) {
	let argList1: A[] = [];
	for (let j = 0; j < N; j++) {
		if (j !== index) argList1.push(a[2 * j], a[2 * j + 1]);
	}
	return argList1;
}

function decideReq(gapMD: number[], strokeMD: number[], N: number) {
	let reqGap = 0;
	let reqInk = 0;
	for (let j = 0; j <= N; j++) {
		reqInk += Math.max(0, gapMD[j]);
	}
	for (let j = 0; j < N; j++) {
		reqGap += Math.max(0, strokeMD[j]);
	}
	return { reqGap, reqInk };
}

export interface MidHintTemplateProps {
	gapMD: number[];
	inkMD: number[];
	allowMerge: number[];
	fb: boolean;
	ft: boolean;
}

function* MergeBodyMain(
	N: number,
	mh: MidHintTemplateProps,

	e: ProgramDsl,
	zBot: Variable,
	zTop: Variable,
	zMids: Variable[],
	aZMids: Variable,
	mi: number,
	consequent: () => Iterable<Statement>
) {
	const props1: MidHintTemplateProps = {
		gapMD: drop(mh.gapMD, Math.min(mi, N)),
		inkMD: drop(mh.inkMD, Math.min(mi, N - 1)),
		allowMerge: drop(mh.allowMerge, mi),
		fb: mh.fb,
		ft: mh.ft
	};
	yield e.if(
		e.call(
			THintMultipleStrokesImpl(N - 1, props1),
			...[zBot, zTop, ...dropMidList(zMids, Math.min(mi, N - 1), N)]
		),
		function*() {
			yield* consequent();
			yield e.return(1);
		},
		function*() {
			yield e.call(HintMultipleStrokesGiveUp, N, zBot, zTop, aZMids.ptr);
			yield e.return(0);
		}
	);
}

function* MergeBody(
	N: number,
	mh: MidHintTemplateProps,
	mergeIndex: number,
	mergeDown: number,

	e: ProgramDsl,
	zBot: Variable,
	zTop: Variable,
	zMids: Variable[],
	aZMids: Variable
) {
	if (mergeIndex === 0) {
		yield e.scfs(zMids[0], e.gc.cur(zBot));
		yield e.scfs(zMids[1], e.gc.cur(zBot));
		yield* MergeBodyMain(N, mh, e, zBot, zTop, zMids, aZMids, 0, e.emptyBlock());
	} else if (mergeIndex === N) {
		yield e.scfs(zMids[2 * (N - 1) + 0], e.gc.cur(zTop));
		yield e.scfs(zMids[2 * (N - 1) + 1], e.gc.cur(zTop));
		yield* MergeBodyMain(N, mh, e, zBot, zTop, zMids, aZMids, N, e.emptyBlock());
	} else if (mergeDown) {
		yield* MergeBodyMain(N, mh, e, zBot, zTop, zMids, aZMids, mergeIndex, function*() {
			yield e.scfs(zMids[2 * mergeIndex], e.gc.cur(zMids[2 * (mergeIndex - 1)]));
			yield e.scfs(zMids[2 * mergeIndex + 1], e.gc.cur(zMids[2 * (mergeIndex - 1) + 1]));
		});
	} else {
		yield* MergeBodyMain(N, mh, e, zBot, zTop, zMids, aZMids, mergeIndex - 1, function*() {
			yield e.scfs(zMids[2 * (mergeIndex - 1)], e.gc.cur(zMids[2 * mergeIndex]));
			yield e.scfs(zMids[2 * (mergeIndex - 1) + 1], e.gc.cur(zMids[2 * mergeIndex + 1]));
		});
	}
}

function* AlignBodyMain(
	N: number,
	mh: MidHintTemplateProps,

	e: ProgramDsl,
	zBot: Variable,
	zTop: Variable,
	zMids: Variable[],
	aZMids: Variable,
	mi: number,
	consequent: () => Iterable<Statement>
) {
	let mdArr = drop(mh.gapMD, mi);
	mdArr[mi] += 1;
	const props1: MidHintTemplateProps = {
		gapMD: mdArr,
		inkMD: drop(mh.inkMD, mi),
		allowMerge: [],
		fb: mh.fb,
		ft: mh.ft
	};
	yield e.if(
		e.call(
			THintMultipleStrokesImpl(N - 1, props1),
			...[zBot, zTop, ...dropMidList(zMids, mi, N)]
		),
		function*() {
			yield* consequent();
			yield e.return(1);
		},
		function*() {
			yield e.call(HintMultipleStrokesGiveUp, N, zBot, zTop, aZMids.ptr);
			yield e.return(0);
		}
	);
}

function* AlignBody(
	N: number,
	mh: MidHintTemplateProps,

	mergeIndex: number,
	mergeDown: number,

	e: ProgramDsl,
	zBot: Variable,
	zTop: Variable,
	zMids: Variable[],
	aZMids: Variable
) {
	if (mergeIndex === 0) {
		yield e.call(CollideHangBottom, zBot, zMids[0], zMids[1]);
		yield* AlignBodyMain(N, mh, e, zBot, zTop, zMids, aZMids, 0, e.emptyBlock());
	} else if (mergeIndex === N) {
		yield e.call(CollideHangTop, zTop, zMids[2 * (N - 1)], zMids[2 * (N - 1) + 1]);
		yield* AlignBodyMain(N, mh, e, zBot, zTop, zMids, aZMids, N - 1, e.emptyBlock());
	} else if (mergeDown) {
		yield* AlignBodyMain(N, mh, e, zBot, zTop, zMids, aZMids, mergeIndex, function*() {
			const botCur = zMids[2 * mergeIndex + 0],
				topCur = zMids[2 * mergeIndex + 1];
			const botBelow = zMids[2 * mergeIndex - 2],
				topBelow = zMids[2 * mergeIndex - 1];
			yield e.call(CollideDownTwoStrokes, botCur, topCur, botBelow, topBelow);
		});
	} else {
		yield* AlignBodyMain(N, mh, e, zBot, zTop, zMids, aZMids, mergeIndex - 1, function*() {
			const botCur = zMids[2 * mergeIndex - 2],
				topCur = zMids[2 * mergeIndex - 1];
			const botAbove = zMids[2 * mergeIndex + 0],
				topAbove = zMids[2 * mergeIndex + 1];
			yield e.call(CollideUpTwoStrokes, botCur, topCur, botAbove, topAbove);
		});
	}
}

const THintMultipleStrokesImpl: EdslFunctionTemplate<[number, MidHintTemplateProps]> = TemplateEx(
	"IdeographProgram::THintMultipleStrokes",
	(N: number, props: MidHintTemplateProps) => {
		return [
			N,
			props.gapMD,
			props.inkMD,
			props.fb ? 1 : 0,
			props.ft ? 1 : 0,
			getRecPath(props.allowMerge, N)
		];
	},
	function*(e, N: number, props: MidHintTemplateProps) {
		const [zBot, zTop, ...zMids] = e.args(2 + 2 * N);

		const aGapMD = e.local(N + 1);
		const aStrokeMD = e.local(N);
		const aZMids = e.local(N * 2);
		const aRecPath = e.local(N);

		yield e.call(TInitMD(N + 1, props.gapMD), aGapMD.ptr);
		yield e.call(TInitMD(N, props.inkMD), aStrokeMD.ptr);
		yield e.call(TInitZMids(N), aZMids.ptr, ...zMids);
		yield e.call(TInitRecPath(N, getRecPath(props.allowMerge, N)), aRecPath.ptr);

		yield e.call(
			THintMultipleStrokesMainImpl(N),
			e.coerce.toF26D6(props.fb ? 2 : 1),
			e.coerce.toF26D6(props.ft ? 2 : 1),
			zBot,
			zTop,
			aZMids.ptr,
			aGapMD.ptr,
			aStrokeMD.ptr,
			aRecPath.ptr
		);
	}
);

export function THintMultipleStrokes(
	N: number,
	gapMD: number[],
	inkMD: number[],
	allowMerge: number[] = [],
	fb: boolean = false,
	ft: boolean = false
) {
	const props: MidHintTemplateProps = { gapMD, inkMD, allowMerge, fb, ft };
	return THintMultipleStrokesImpl(N, props);
}
