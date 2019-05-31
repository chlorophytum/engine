import {
	EdslFunctionTemplate,
	LibFunc,
	ProgramDsl,
	Statement,
	Template,
	TemplateEx,
	Variable
} from "@chlorophytum/hltt";

import { BalanceStrokes } from "./balance";
import {
	InitMSDGapEntries,
	InitMSDInkEntries,
	MaxAverageLoop,
	MovePointsForMiddleHint
} from "./loop";
import { HintMultipleStrokesGiveUp, HintMultipleStrokesSimple } from "./simple";
import {
	CollideDownTwoStrokes,
	CollideHangBottom,
	CollideHangTop,
	CollideUpTwoStrokes
} from "./stroke-omit";
import { GetFillRate, VisCeil, VisDist } from "./vis-dist";

const GetInkDistFromTotalDist = LibFunc("IdeographProgram::getGapDistFromTotalDist", function*(e) {
	const [dCur, iOrig, gOrig, gReq, iReq] = e.args(5);
	yield e.return(
		e.min(
			e.sub(dCur, gReq),
			e.max(iReq, e.round.black(e.mul(dCur, e.div(iOrig, e.add(gOrig, iOrig)))))
		)
	);
});

const DecideRequiredGap = LibFunc(`IdeographProgram::decideRequiredGap`, function*(e) {
	const [N, vpGapMD] = e.args(2);
	const pGapMD = e.coerce.fromIndex.variable(vpGapMD);
	const j = e.local();
	const s = e.local();
	yield e.set(j, 0);
	yield e.set(s, 0);
	yield e.while(e.lt(j, N), function*() {
		yield e.set(s, e.add(s, e.part(pGapMD, j)));
		yield e.set(j, e.add(j, 1));
	});
	yield e.return(s);
});

const THintMultipleStrokesMidSize = Template(
	"IdeographProgram::THintMultipleStrokes::MidSize",
	function*(e, NMax: number) {
		const [N, dist, frBot, zBot, zTop, vpZMids, vpGapMD, vpInkMD] = e.args(8);

		const pxReqGap = e.local();
		const pxReqInk = e.local();
		yield e.set(pxReqGap, e.call(DecideRequiredGap, e.add(1, N), vpGapMD));
		yield e.set(pxReqInk, e.call(DecideRequiredGap, N, vpInkMD));

		const totalInk = e.local();
		const totalGap = e.local();
		const aGapDist = e.local(NMax + 1);
		const bGapDist = e.local(NMax + 1);
		const cGapDist = e.local(NMax + 1);
		const gapDivisor = e.local(NMax + 1);
		const gaps = e.local(NMax + 1);
		const gapOcc = e.local(NMax + 1);
		const aInkDist = e.local(NMax);
		const bInkDist = e.local(NMax);
		const cInkDist = e.local(NMax);
		const inkDivisor = e.local(NMax);
		const inks = e.local(NMax);
		const inkOcc = e.local(NMax);

		const scalar = e.local();
		yield e.set(scalar, e.div(dist, e.sub(e.gc.orig(zTop), e.gc.orig(zBot))));

		yield e.set(totalInk, 0);
		yield e.set(totalGap, 0);

		yield e.call(
			InitMSDGapEntries,
			N,
			totalGap.ptr,
			aGapDist.ptr,
			bGapDist.ptr,
			cGapDist.ptr,
			gapDivisor.ptr,
			gaps.ptr,
			zBot,
			zTop,
			vpZMids,
			vpGapMD
		);
		yield e.call(
			InitMSDInkEntries,
			N,
			totalInk.ptr,
			aInkDist.ptr,
			bInkDist.ptr,
			cInkDist.ptr,
			inkDivisor.ptr,
			inks.ptr,
			vpZMids,
			vpInkMD
		);

		const actualInk = e.local();
		yield e.set(
			actualInk,
			e.call(GetInkDistFromTotalDist, dist, totalInk, totalGap, pxReqGap, pxReqInk)
		);

		yield e.call(
			MaxAverageLoop,
			aGapDist.ptr,
			bGapDist.ptr,
			cGapDist.ptr,
			gapDivisor.ptr,
			gaps.ptr,
			e.add(1, N),
			scalar,
			e.sub(e.sub(dist, actualInk), pxReqGap)
		);
		yield e.call(
			MaxAverageLoop,
			aInkDist.ptr,
			bInkDist.ptr,
			cInkDist.ptr,
			inkDivisor.ptr,
			inks.ptr,
			N,
			scalar,
			e.sub(actualInk, pxReqInk)
		);

		// Balance
		yield e.call(
			BalanceStrokes,
			N,
			scalar,
			gapOcc.ptr,
			inkOcc.ptr,
			gaps.ptr,
			inks.ptr,
			aGapDist.ptr,
			aInkDist.ptr
		);

		yield e.call(
			MovePointsForMiddleHint,
			N,
			e.call(VisCeil, e.gc.cur(zBot), frBot),
			gaps.ptr,
			inks.ptr,
			vpZMids
		);
	}
);

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
		const { mergeIndex, mergeDown } = decideMerge(props.allowMerge, N);
		const { reqGap, reqInk } = decideReq(props.gapMD, props.inkMD, N);
		const [zBot, zTop, ...zMids] = e.args(2 + 2 * N);

		const dist = e.local();
		const frBot = e.local();
		const frTop = e.local();

		const aGapMD = e.local(N + 1);
		const aStrokeMD = e.local(N);
		const aZMids = e.local(N * 2);

		yield e.call(TInitMD(N + 1, props.gapMD), aGapMD.ptr);
		yield e.call(TInitMD(N, props.inkMD), aStrokeMD.ptr);
		yield e.call(TInitZMids(N), aZMids.ptr, ...zMids);

		yield e.set(
			frBot,
			e.mul(
				e.coerce.toF26D6(props.fb ? 2 : 1),
				e.call(GetFillRate, N, zBot, zTop, aZMids.ptr)
			)
		);
		yield e.set(
			frTop,
			e.mul(
				e.coerce.toF26D6(props.ft ? 2 : 1),
				e.call(GetFillRate, N, zBot, zTop, aZMids.ptr)
			)
		);
		yield e.set(dist, e.call(VisDist, zBot, zTop, frBot, frTop));

		// If we don't have enough pixels...
		yield e.if(e.lt(dist, e.coerce.toF26D6(reqGap + reqInk)), function*() {
			if (mergeIndex >= 0 && N > 1) {
				// Is stroke merging allowed? If so, we can do something interesting...
				yield e.if(
					e.gteq(dist, e.coerce.toF26D6(reqGap + reqInk - 1)),
					() => AlignBody(N, props, mergeIndex, mergeDown, e, zBot, zTop, zMids, aZMids),
					() => MergeBody(N, props, mergeIndex, mergeDown, e, zBot, zTop, zMids, aZMids)
				);
			} else {
				// Otherwise, give up
				yield e.call(HintMultipleStrokesGiveUp, N, zBot, zTop, aZMids.ptr);
				yield e.return(0);
			}
		});

		// If we have *many* pixels, do in a simple way
		yield e.if(e.gt(dist, e.coerce.toF26D6(8 * (reqGap + reqInk))), function*() {
			yield e.call(HintMultipleStrokesSimple, N, zBot, zTop, aZMids.ptr);
			yield e.return(1);
		});

		yield e.call(
			THintMultipleStrokesMidSize(8 * Math.ceil(N / 8)),
			N,
			dist,
			frBot,
			zBot,
			zTop,
			aZMids.ptr,
			aGapMD.ptr,
			aStrokeMD.ptr
		);
		yield e.return(1);
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

const TInitMD = Template("IdeographProgram::TInitMD2", function*(e, N: number, md: number[]) {
	const [vpMD] = e.args(1);
	const pMD = e.coerce.fromIndex.variable(vpMD, N);
	yield e.setArr(pMD, md.map(e.coerce.toF26D6));
});

const TInitZMids = Template(`IdeographProgram::TInitZMids`, function*(e, N: number) {
	const [vpMD, ...zMids] = e.args(1 + 2 * N);
	const pMD = e.coerce.fromIndex.variable(vpMD, 2 * N);
	yield e.setArr(pMD, zMids);
});
