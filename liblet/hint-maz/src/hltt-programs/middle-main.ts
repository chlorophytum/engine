import { EdslFunctionTemplate, LibFunc, Template } from "@chlorophytum/hltt";

import { DecideRequiredGap, THintMultipleStrokesMidSize } from "./middle-midsize";
import { HintMultipleStrokesGiveUp, HintMultipleStrokesSimple } from "./simple";
import {
	AlignTwoStrokes,
	CollideDownTwoStrokes,
	CollideHangBottom,
	CollideHangTop,
	CollideUpTwoStrokes
} from "./stroke-omit";
import { GetFillRate, VisDist } from "./vis-dist";

export const TwoN = LibFunc(`IdeographProgram::TwoN`, function*($) {
	const [x] = $.args(1);
	yield $.return($.add(x, x));
});
export const TwoN_P1 = LibFunc(`IdeographProgram::TwoN_P1`, function*($) {
	const [x] = $.args(1);
	yield $.return($.add(1, $.add(x, x)));
});
export const TwoN_M1 = LibFunc(`IdeographProgram::TwoN_M1`, function*($) {
	const [x] = $.args(1);
	yield $.return($.sub($.add(x, x), 1));
});
export const TwoN_M2 = LibFunc(`IdeographProgram::TwoN_M2`, function*($) {
	const [x] = $.args(1);
	yield $.return($.sub($.add(x, x), 2));
});
export const DropArrayItem = LibFunc("IdeographProgram::DropArrayItem", function*($) {
	const [N, i, vpA, vpB] = $.args(4);
	const pA = $.coerce.fromIndex.variable(vpA);
	const pB = $.coerce.fromIndex.variable(vpB);
	const j = $.local();
	const k = $.local();
	yield $.set(j, 0);
	yield $.set(k, 0);
	yield $.while($.lt(j, N), function*() {
		yield $.if($.neq(j, i), function*() {
			yield $.set($.part(pB, k), $.part(pA, j));
			yield $.set(k, $.add(1, k));
		});
		yield $.set(j, $.add(1, j));
	});
});
export const DropArrayItemX2 = LibFunc("IdeographProgram::DropArrayItemX2", function*($) {
	const [N, i, vpA, vpB] = $.args(4);
	const pA = $.coerce.fromIndex.variable(vpA);
	const pB = $.coerce.fromIndex.variable(vpB);
	const j = $.local();
	const k = $.local();
	yield $.set(j, 0);
	yield $.set(k, 0);
	yield $.while($.lt(j, N), function*() {
		yield $.if($.neq(j, i), function*() {
			yield $.set($.part(pB, $.call(TwoN, k)), $.part(pA, $.call(TwoN, j)));
			yield $.set($.part(pB, $.call(TwoN_P1, k)), $.part(pA, $.call(TwoN_P1, j)));
			yield $.set(k, $.add(1, k));
		});
		yield $.set(j, $.add(1, j));
	});
});

export const UpdateNewProps = LibFunc(
	`IdeographProgram::THintMultipleStrokes::UpdateNewProps`,
	function*($) {
		const [
			N,
			collideMode,
			mergeIndex,
			mergeDown,
			vpGapMD,
			vpInkMD,
			vpZMids,
			vpGapMD1,
			vpInkMD1,
			vpZMids1
		] = $.args(10);

		const pGapMD1 = $.coerce.fromIndex.variable(vpGapMD1);
		const dropGapIndex = $.local();
		const dropInkIndex = $.local();
		yield $.if(
			$.lteq(mergeIndex, 0),
			function*() {
				yield $.set(dropGapIndex, 0);
				yield $.set(dropInkIndex, 0);
			},
			function*() {
				yield $.if(
					$.gteq(mergeIndex, N),
					function*() {
						yield $.set(dropGapIndex, N);
						yield $.set(dropInkIndex, $.sub(N, 1));
					},
					function*() {
						yield $.if(
							mergeDown,
							function*() {
								yield $.set(dropGapIndex, mergeIndex);
								yield $.set(dropInkIndex, mergeIndex);
							},
							function*() {
								yield $.set(dropGapIndex, mergeIndex);
								yield $.set(dropInkIndex, $.sub(mergeIndex, 1));
							}
						);
					}
				);
			}
		);

		yield $.call(DropArrayItem, $.add(1, N), dropGapIndex, vpGapMD, vpGapMD1);
		yield $.call(DropArrayItem, N, dropInkIndex, vpInkMD, vpInkMD1);
		yield $.call(DropArrayItemX2, N, dropInkIndex, vpZMids, vpZMids1);

		// If we are in the collide mode, increase the corresponded gap's minimal depth by 1px.
		yield $.if(collideMode, function*() {
			yield $.set(
				$.part(pGapMD1, dropInkIndex),
				$.add($.coerce.toF26D6(1), $.part(pGapMD1, dropInkIndex))
			);
		});
	}
);

const THintMultipleStrokes_DoMerge_Consequence = LibFunc(
	"IdeographProgram::THintMultipleStrokes::DoMerge::Consequence",
	function*($) {
		const [N, mergeIndex, mergeDown, vpZMids] = $.args(4);
		const pZMids = $.coerce.fromIndex.variable(vpZMids);

		yield $.if($.and($.lt(0, mergeIndex), $.lt(mergeIndex, N)), function*() {
			yield $.if(
				mergeDown,
				function*() {
					yield $.call(
						AlignTwoStrokes,
						$.part(pZMids, $.call(TwoN, mergeIndex)),
						$.part(pZMids, $.call(TwoN_P1, mergeIndex)),
						$.part(pZMids, $.call(TwoN_M2, mergeIndex)),
						$.part(pZMids, $.call(TwoN_M1, mergeIndex))
					);
				},
				function*() {
					yield $.call(
						AlignTwoStrokes,
						$.part(pZMids, $.call(TwoN_M2, mergeIndex)),
						$.part(pZMids, $.call(TwoN_M1, mergeIndex)),
						$.part(pZMids, $.call(TwoN, mergeIndex)),
						$.part(pZMids, $.call(TwoN_P1, mergeIndex))
					);
				}
			);
		});
	}
);
const THintMultipleStrokes_DoMerge_ConsequenceEdge = LibFunc(
	"IdeographProgram::THintMultipleStrokes::DoMerge::ConsequenceEdge",
	function*($) {
		const [N, mergeIndex, zBot, zTop, vpZMids] = $.args(5);
		const pZMids = $.coerce.fromIndex.variable(vpZMids);

		yield $.if($.lteq(mergeIndex, 0), function*() {
			yield $.scfs($.part(pZMids, 0), $.gc.cur(zBot));
			yield $.scfs($.part(pZMids, 1), $.gc.cur(zBot));
		});
		yield $.if($.gteq(mergeIndex, N), function*() {
			yield $.scfs($.part(pZMids, $.call(TwoN_M2, N)), $.gc.cur(zTop));
			yield $.scfs($.part(pZMids, $.call(TwoN_M1, N)), $.gc.cur(zTop));
		});
	}
);
const THintMultipleStrokes_DoMerge: EdslFunctionTemplate<[number]> = Template(
	"IdeographProgram::THintMultipleStrokes::DoMerge",
	function*($, N: number) {
		const [fb, ft, zBot, zTop, vpZMids, vpGapMD, vpInkMD, vpRecPath, vpRecPathCollide] = $.args(
			9
		);

		const pRecPath = $.coerce.fromIndex.variable(vpRecPath);
		const pRecPathCollide = $.coerce.fromIndex.variable(vpRecPathCollide);
		const pRecValue = pRecPath;

		yield $.if($.eq(pRecValue, 0), function*() {
			yield $.call(HintMultipleStrokesGiveUp, N, zBot, zTop, vpZMids);
			yield $.return(0);
		});

		const mergeIndex = $.local();
		const mergeDown = $.local();
		yield $.set(mergeIndex, $.sub($.abs(pRecValue), 1));
		yield $.set(mergeDown, $.lt(pRecValue, 0));

		const gapMD1 = $.local(N);
		const inkMD1 = $.local(N - 1);
		const zMids1 = $.local(2 * N - 2);
		yield $.call(
			UpdateNewProps,
			N,
			0,
			mergeIndex,
			mergeDown,
			vpGapMD,
			vpInkMD,
			vpZMids,
			gapMD1.ptr,
			inkMD1.ptr,
			zMids1.ptr
		);

		yield $.call(
			THintMultipleStrokes_DoMerge_ConsequenceEdge,
			N,
			mergeIndex,
			zBot,
			zTop,
			vpZMids
		);
		yield $.if(
			$.call(
				THintMultipleStrokesMainImpl(N - 1),
				fb,
				ft,
				zBot,
				zTop,
				zMids1.ptr,
				gapMD1.ptr,
				inkMD1.ptr,
				$.part(pRecPath, 1).ptr,
				$.part(pRecPathCollide, 1).ptr
			),
			function*() {
				yield $.call(
					THintMultipleStrokes_DoMerge_Consequence,
					N,
					mergeIndex,
					mergeDown,
					vpZMids
				);
				yield $.return(1);
			},
			function*() {
				yield $.call(HintMultipleStrokesGiveUp, N, zBot, zTop, vpZMids);
				yield $.return(0);
			}
		);
	}
);
const THintMultipleStrokes_DoCollideMerge_Consequence = LibFunc(
	"IdeographProgram::THintMultipleStrokes::DoCollideMerge::Consequence",
	function*($) {
		const [N, mergeIndex, mergeDown, vpZMids] = $.args(4);
		const pZMids = $.coerce.fromIndex.variable(vpZMids);

		yield $.if($.and($.lt(0, mergeIndex), $.lt(mergeIndex, N)), function*() {
			yield $.if(
				mergeDown,
				function*() {
					yield $.call(
						CollideDownTwoStrokes,
						$.part(pZMids, $.call(TwoN, mergeIndex)),
						$.part(pZMids, $.call(TwoN_P1, mergeIndex)),
						$.part(pZMids, $.call(TwoN_M2, mergeIndex)),
						$.part(pZMids, $.call(TwoN_M1, mergeIndex))
					);
				},
				function*() {
					yield $.call(
						CollideUpTwoStrokes,
						$.part(pZMids, $.call(TwoN_M2, mergeIndex)),
						$.part(pZMids, $.call(TwoN_M1, mergeIndex)),
						$.part(pZMids, $.call(TwoN, mergeIndex)),
						$.part(pZMids, $.call(TwoN_P1, mergeIndex))
					);
				}
			);
		});
	}
);
const THintMultipleStrokes_DoCollideMerge_ConsequenceEdge = LibFunc(
	"IdeographProgram::THintMultipleStrokes::DoCollideMerge::ConsequenceEdge",
	function*($) {
		const [N, mergeIndex, zBot, zTop, vpZMids] = $.args(5);
		const pZMids = $.coerce.fromIndex.variable(vpZMids);

		yield $.if($.lteq(mergeIndex, 0), function*() {
			yield $.call(CollideHangBottom, zBot, $.part(pZMids, 0), $.part(pZMids, 1));
		});
		yield $.if($.gteq(mergeIndex, N), function*() {
			yield $.call(
				CollideHangTop,
				zTop,
				$.part(pZMids, $.call(TwoN_M2, N)),
				$.part(pZMids, $.call(TwoN_M1, N))
			);
		});
	}
);
const THintMultipleStrokes_DoCollideMerge: EdslFunctionTemplate<[number]> = Template(
	"IdeographProgram::THintMultipleStrokes::DoCollideMerge",
	function*($, N: number) {
		const [fb, ft, zBot, zTop, vpZMids, vpGapMD, vpInkMD, vpRecPath, vpRecPathCollide] = $.args(
			9
		);
		const pRecPath = $.coerce.fromIndex.variable(vpRecPath);
		const pRecPathCollide = $.coerce.fromIndex.variable(vpRecPathCollide);
		const pRecValue = pRecPathCollide;

		yield $.if($.eq(pRecValue, 0), function*() {
			yield $.call(HintMultipleStrokesGiveUp, N, zBot, zTop, vpZMids);
			yield $.return(0);
		});

		const collideIndex = $.local();
		const collideDown = $.local();
		yield $.set(collideIndex, $.sub($.abs(pRecValue), 1));
		yield $.set(collideDown, $.lt(pRecValue, 0));

		const gapMD1 = $.local(N);
		const inkMD1 = $.local(N - 1);
		const zMids1 = $.local(2 * N - 2);
		yield $.call(
			UpdateNewProps,
			N,
			1,
			collideIndex,
			collideDown,
			vpGapMD,
			vpInkMD,
			vpZMids,
			gapMD1.ptr,
			inkMD1.ptr,
			zMids1.ptr
		);

		yield $.call(
			THintMultipleStrokes_DoCollideMerge_ConsequenceEdge,
			N,
			collideIndex,
			zBot,
			zTop,
			vpZMids
		);
		yield $.if(
			$.call(
				THintMultipleStrokesMainImpl(N - 1),
				fb,
				ft,
				zBot,
				zTop,
				zMids1.ptr,
				gapMD1.ptr,
				inkMD1.ptr,
				$.part(pRecPath, 1).ptr,
				$.part(pRecPathCollide, 1).ptr
			),
			function*() {
				yield $.call(
					THintMultipleStrokes_DoCollideMerge_Consequence,
					N,
					collideIndex,
					collideDown,
					vpZMids
				);
				yield $.return(1);
			},
			function*() {
				yield $.call(HintMultipleStrokesGiveUp, N, zBot, zTop, vpZMids);
				yield $.return(0);
			}
		);
	}
);
export const THintMultipleStrokes_OmitImpl = Template(
	"IdeographProgram::THintMultipleStrokes::OmitImpl",
	function*($, N: number) {
		const [
			dist,
			reqDist,
			fb,
			ft,
			zBot,
			zTop,
			vpZMids,
			vpGapMD,
			vpInkMD,
			vpRecPath,
			vpRecPathCollide
		] = $.args(11);

		if (N <= 1) {
			yield $.call(HintMultipleStrokesGiveUp, N, zBot, zTop, vpZMids);
			yield $.return(0);
			return;
		}

		yield $.if(
			$.gteq(dist, $.sub(reqDist, $.coerce.toF26D6(1))),
			function*() {
				yield $.return(
					$.call(
						THintMultipleStrokes_DoCollideMerge(N),
						fb,
						ft,
						zBot,
						zTop,
						vpZMids,
						vpGapMD,
						vpInkMD,
						vpRecPath,
						vpRecPathCollide
					)
				);
			},
			function*() {
				yield $.return(
					$.call(
						THintMultipleStrokes_DoMerge(N),
						fb,
						ft,
						zBot,
						zTop,
						vpZMids,
						vpGapMD,
						vpInkMD,
						vpRecPath,
						vpRecPathCollide
					)
				);
			}
		);
	}
);

export const THintMultipleStrokesMainImpl: EdslFunctionTemplate<[number]> = Template(
	"IdeographProgram::THintMultipleStrokes::MainImpl",
	function*($, N: number) {
		const [fb, ft, zBot, zTop, vpZMids, vpGapMD, vpInkMD, vpRecPath, vpRecPathCollide] = $.args(
			9
		);

		const dist = $.local();
		const frBot = $.local();
		const frTop = $.local();
		yield $.set(frBot, $.mul(fb, $.call(GetFillRate, N, zBot, zTop, vpZMids)));
		yield $.set(frTop, $.mul(ft, $.call(GetFillRate, N, zBot, zTop, vpZMids)));
		yield $.set(dist, $.call(VisDist, zBot, zTop, frBot, frTop));

		const pxReqGap = $.local();
		const pxReqInk = $.local();
		yield $.set(pxReqGap, $.call(DecideRequiredGap, $.add(1, N), vpGapMD));
		yield $.set(pxReqInk, $.call(DecideRequiredGap, N, vpInkMD));

		yield $.if($.lt(dist, $.add(pxReqGap, pxReqInk)), function*() {
			yield $.return(
				$.call(
					THintMultipleStrokes_OmitImpl(N),
					dist,
					$.add(pxReqGap, pxReqInk),
					fb,
					ft,
					zBot,
					zTop,
					vpZMids,
					vpGapMD,
					vpInkMD,
					vpRecPath,
					vpRecPathCollide
				)
			);
		});

		// If we have *many* pixels, do in a simple way
		yield $.if($.gt(dist, $.mul($.coerce.toF26D6(8), $.add(pxReqGap, pxReqInk))), function*() {
			yield $.call(HintMultipleStrokesSimple, N, zBot, zTop, vpZMids);
			yield $.return(1);
		});

		const allocN = 8 * Math.ceil(N / 8);

		yield $.call(
			THintMultipleStrokesMidSize(allocN),
			N,
			dist,
			frBot,
			zBot,
			zTop,
			vpZMids,
			vpGapMD,
			vpInkMD
		);
		yield $.return(1);
	}
);
