import {
	EdslFunctionTemplate,
	Expression,
	LibFunc,
	ProgramDsl,
	TemplateEx,
	Variable
} from "@chlorophytum/hltt";

import { TInitMD, TInitRecPath, TInitZMids } from "./middle-array";
import { THintMultipleStrokesMainImpl } from "./middle-main";
import { OctDistOrig } from "./vis-dist";

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

export interface MidHintTemplateProps {
	gapMD: number[];
	inkMD: number[];
	allowMerge: number[];
	fb: boolean;
	ft: boolean;
}

function midBot(e: ProgramDsl, zMids: Variable, index: Expression) {
	return e.part(zMids, e.mul(e.coerce.toF26D6(2), index));
}
function midTop(e: ProgramDsl, zMids: Variable, index: Expression) {
	return e.part(zMids, e.add(1, e.mul(e.coerce.toF26D6(2), index)));
}
const AmendMinGapDist = LibFunc("IdeographProgram::AmendMinGapDist", function*(e) {
	const [N, zBot, zTop, vpZMids, vpGapMD] = e.args(5);
	const pZMids = e.coerce.fromIndex.variable(vpZMids);
	const pGapMD = e.coerce.fromIndex.variable(vpGapMD);

	const j = e.local();
	const gapDist = e.local();

	yield e.set(j, 0);
	yield e.set(gapDist, 0);
	yield e.while(e.lteq(j, N), function*() {
		yield e.if(
			e.eq(j, 0),
			function*() {
				yield e.set(gapDist, e.call(OctDistOrig, zBot, midBot(e, pZMids, j)));
			},
			function*() {
				yield e.if(
					e.eq(j, N),
					function*() {
						yield e.set(
							gapDist,
							e.call(OctDistOrig, midTop(e, pZMids, e.sub(j, 1)), zTop)
						);
					},
					function*() {
						yield e.set(
							gapDist,
							e.call(
								OctDistOrig,
								midTop(e, pZMids, e.sub(j, 1)),
								midBot(e, pZMids, j)
							)
						);
					}
				);
			}
		);

		yield e.set(
			e.part(pGapMD, j),
			e.max(
				e.part(pGapMD, j),
				e.mul(
					e.min(e.coerce.toF26D6(1), e.part(pGapMD, j)),
					e.max(0, e.floor(e.sub(gapDist, e.mul(e.coerce.toF26D6(2), e.mppem()))))
				)
			)
		);

		yield e.set(j, e.add(1, j));
	});
});

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
		const aInkMD = e.local(N);
		const aZMids = e.local(N * 2);
		const aRecPath = e.local(N);

		yield e.call(TInitMD(N + 1, props.gapMD), aGapMD.ptr);
		yield e.call(TInitMD(N, props.inkMD), aInkMD.ptr);
		yield e.call(TInitZMids(N), aZMids.ptr, ...zMids);
		yield e.call(TInitRecPath(N, getRecPath(props.allowMerge, N)), aRecPath.ptr);

		yield e.call(AmendMinGapDist, N, zBot, zTop, aZMids.ptr, aGapMD.ptr);

		yield e.call(
			THintMultipleStrokesMainImpl(N),
			e.coerce.toF26D6(props.fb ? 2 : 1),
			e.coerce.toF26D6(props.ft ? 2 : 1),
			zBot,
			zTop,
			aZMids.ptr,
			aGapMD.ptr,
			aInkMD.ptr,
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
