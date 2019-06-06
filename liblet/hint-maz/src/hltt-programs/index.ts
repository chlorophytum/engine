import {
	EdslFunctionTemplate,
	Expression,
	LibFunc,
	ProgramDsl,
	Template,
	TemplateEx,
	Variable
} from "@chlorophytum/hltt";

import { MultipleAlignZoneMeta } from "../props";
import { splitNArgs } from "../util";

import { MapArrIntToPx, TInitArr, TInitMD, TInitRecPath, TInitZMids } from "./middle-array";
import { THintMultipleStrokesMainImpl } from "./middle-main";
import { OctDistOrig } from "./vis-dist";

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
					e.max(
						0,
						e.round.white(
							e.sub(
								gapDist,
								e.add(e.coerce.toF26D6(1), e.mul(e.coerce.toF26D6(2), e.mppem()))
							)
						)
					)
				)
			)
		);

		yield e.set(j, e.add(1, j));
	});
});

export const THintMultipleStrokesStub: EdslFunctionTemplate<
	[number, MultipleAlignZoneMeta]
> = TemplateEx(
	"IdeographProgram::THintMultipleStrokesStub",
	(N: number, props: MultipleAlignZoneMeta) => {
		return [
			N,
			props.gapMinDist,
			props.inkMinDist,
			props.bottomFree ? 1 : 0,
			props.topFree ? 1 : 0,
			props.recPath
		];
	},
	function*($, N: number, props: MultipleAlignZoneMeta) {
		const [zBot, zTop, ...zMids] = $.args(2 + 2 * N);

		const aGapMD = $.local(N + 1);
		const aInkMD = $.local(N);
		const aRecPath = $.local(N);
		const aZMids = $.local(N * 2);

		yield $.call(TInitMD(N + 1, props.gapMinDist), aGapMD.ptr);
		yield $.call(TInitMD(N, props.inkMinDist), aInkMD.ptr);
		yield $.call(TInitRecPath(N, props.recPath), aRecPath.ptr);
		yield $.call(TInitZMids(N), aZMids.ptr, ...zMids);

		yield $.call(AmendMinGapDist, N, zBot, zTop, aZMids.ptr, aGapMD.ptr);

		yield $.call(
			THintMultipleStrokesMainImpl(N),
			$.coerce.toF26D6(props.bottomFree ? 2 : 1),
			$.coerce.toF26D6(props.topFree ? 2 : 1),
			zBot,
			zTop,
			aZMids.ptr,
			aGapMD.ptr,
			aInkMD.ptr,
			aRecPath.ptr
		);
	}
);

function MultipleAlignZoneArgQuantity(N: number) {
	return N + 1 + N + N + 1 + 1 + 1 + 1 + 2 * N;
}

export const THintMultipleStrokesExplicit = Template(
	"IdeographProgram::THintMultipleStrokesStub",
	function*($, N: number) {
		const argQty = [N + 1, N, N, 1, 1, 1, 1, 2 * N];
		const args = $.args(MultipleAlignZoneArgQuantity(N));
		const [
			ixGapMinDist,
			ixInkMinDist,
			ixRecPath,
			[iBotFree],
			[iTopFree],
			[zBot],
			[zTop],
			zMids
		] = splitNArgs(args, argQty);

		const aGapMD = $.local(N + 1);
		const aInkMD = $.local(N);
		const aRecPath = $.local(N);
		const aZMids = $.local(N * 2);

		yield $.call(TInitArr(N + 1), aGapMD.ptr, ...ixGapMinDist);
		yield $.call(TInitArr(N), aInkMD.ptr, ...ixInkMinDist);
		yield $.call(TInitArr(N), aRecPath.ptr, ...ixRecPath);
		yield $.call(TInitZMids(N), aZMids.ptr, ...zMids);
		yield $.call(MapArrIntToPx, aGapMD.ptr, N + 1);
		yield $.call(MapArrIntToPx, aInkMD.ptr, N);

		yield $.call(AmendMinGapDist, N, zBot, zTop, aZMids.ptr, aGapMD.ptr);

		yield $.call(
			THintMultipleStrokesMainImpl(N),
			$.toFloat(iBotFree),
			$.toFloat(iTopFree),
			zBot,
			zTop,
			aZMids.ptr,
			aGapMD.ptr,
			aInkMD.ptr,
			aRecPath.ptr
		);
	}
);
