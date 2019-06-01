import { Expression, LibFunc, ProgramDsl, Variable } from "@chlorophytum/hltt";

import { OctDistOrig } from "./vis-dist";

const DIV_STEP = 2;

function midBot(e: ProgramDsl, zMids: Variable, index: Expression) {
	return e.part(zMids, e.mul(e.coerce.toF26D6(2), index));
}
function midTop(e: ProgramDsl, zMids: Variable, index: Expression) {
	return e.part(zMids, e.add(1, e.mul(e.coerce.toF26D6(2), index)));
}

export const InitMSDGapEntries = LibFunc("IdeographProgram::initMSDGapEntries", function*(e) {
	const [N, vpTotalDist, vpA, vpB, vpC, vpDiv, vpAlloc, zBot, zTop, vpZMids, vpGapMD] = e.args(
		11
	);

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
		yield e.call(
			InitMSDistEntry,
			e.toFloat(N),
			vpTotalDist,
			vpA,
			vpB,
			vpC,
			vpDiv,
			vpAlloc,
			j,
			gapDist,
			e.coerce.toF26D6(1),
			e.part(pGapMD, j)
		);
		yield e.set(j, e.add(1, j));
	});
});

export const InitMSDInkEntries = LibFunc("IdeographProgram::initMSDInkEntries", function*(e) {
	const [N, vpTotalDist, vpA, vpB, vpC, vpDiv, vpAlloc, vpZMids, vpStrokeMD] = e.args(9);

	const pZMids = e.coerce.fromIndex.variable(vpZMids);
	const pStrokeMD = e.coerce.fromIndex.variable(vpStrokeMD);

	const j = e.local();
	yield e.set(j, 0);
	yield e.while(e.lt(j, N), function*() {
		yield e.call(
			InitMSDistEntry,
			e.toFloat(N),
			vpTotalDist,
			vpA,
			vpB,
			vpC,
			vpDiv,
			vpAlloc,
			j,
			e.call(OctDistOrig, midBot(e, pZMids, j), midTop(e, pZMids, j)),
			e.coerce.toF26D6(1),
			e.part(pStrokeMD, j)
		);
		yield e.set(j, e.add(1, j));
	});
});

const InitMSDistEntry = LibFunc("IdeographProgram::initMSDistEntry", function*(e) {
	const [N, vpTotalDist, vpA, vpB, vpC, vpDiv, vpAlloc, j, x, r, p] = e.args(11);
	const pTotalDist = e.coerce.fromIndex.variable(vpTotalDist);
	const pA = e.coerce.fromIndex.variable(vpA);
	const pB = e.coerce.fromIndex.variable(vpB);
	const pC = e.coerce.fromIndex.variable(vpC);
	const pDiv = e.coerce.fromIndex.variable(vpDiv);
	const pAlloc = e.coerce.fromIndex.variable(vpAlloc);
	const divisor = e.add(e.coerce.toF26D6(1), e.mul(e.coerce.toF26D6(DIV_STEP), p));
	yield e.set(e.part(pA, j), e.max(0, x));
	yield e.set(e.part(pB, j), e.max(0, e.sub(e.mul(r, x), e.div(e.coerce.toF26D6(1), N))));
	yield e.set(e.part(pC, j), e.div(e.part(pB, j), divisor));
	yield e.set(pTotalDist, e.add(pTotalDist, e.part(pA, j)));
	yield e.set(e.part(pDiv, j), divisor);
	yield e.set(e.part(pAlloc, j), p);
});

export const MaxAverageLoop = LibFunc("IdeographProgram::maxAverageLoop", function*(e) {
	const [vpA, vpB, vpC, vpDiv, vpAlloc, N, scalar, rest] = e.args(8);
	const pA = e.coerce.fromIndex.variable(vpA);
	const pB = e.coerce.fromIndex.variable(vpB);
	const pC = e.coerce.fromIndex.variable(vpC);
	const pDiv = e.coerce.fromIndex.variable(vpDiv);
	const pAlloc = e.coerce.fromIndex.variable(vpAlloc);

	const ONE = e.coerce.toF26D6(1);

	const restInk = e.local();
	const jOpt = e.local();
	const jLoop = e.local();
	const dOpt = e.local();
	yield e.set(restInk, rest);
	yield e.while(e.gt(restInk, 0), function*() {
		yield e.set(jOpt, -1);
		yield e.set(dOpt, -255);
		yield e.set(jLoop, 0);
		yield e.while(e.lt(jLoop, N), function*() {
			yield e.if(
				e.and(
					e.lt(
						e.part(pAlloc, jLoop),
						e.add(e.coerce.toF26D6(2), e.mul(scalar, e.part(pA, jLoop)))
					),
					e.gt(e.part(pC, jLoop), dOpt)
				),
				function*() {
					yield e.set(jOpt, jLoop);
					yield e.set(dOpt, e.part(pC, jLoop));
				}
			);
			yield e.set(jLoop, e.add(jLoop, 1));
		});

		yield e.if(e.gteq(jOpt, 0), function*() {
			yield e.set(e.part(pAlloc, jOpt), e.add(e.part(pAlloc, jOpt), e.min(restInk, ONE)));
			yield e.set(e.part(pDiv, jOpt), e.add(e.part(pDiv, jOpt), e.coerce.toF26D6(DIV_STEP)));
			yield e.set(e.part(pC, jOpt), e.div(e.part(pB, jOpt), e.part(pDiv, jOpt)));
		});
		yield e.set(restInk, e.sub(restInk, ONE));
	});
});

const PlaceStrokeDist2 = LibFunc("IdeographProgram::placeStrokeDist2", function*(e) {
	const [vpY, zBot, zTop, gap, ink] = e.args(5);
	const pY = e.coerce.fromIndex.variable(vpY);
	yield e.set(pY, e.add(pY, gap));
	yield e.mdap(zBot);
	yield e.scfs(zBot, pY);
	yield e.set(pY, e.add(pY, ink));
	yield e.scfs(zTop, pY);
});

export const MovePointsForMiddleHint = LibFunc(
	"IdeographProgram::movePointsForMiddleHint",
	function*(e) {
		const [N, zBot, zTop, y0, vpGaps, vpInks, vpZMids] = e.args(7);
		const pGaps = e.coerce.fromIndex.variable(vpGaps);
		const pInks = e.coerce.fromIndex.variable(vpInks);
		const pZMids = e.coerce.fromIndex.variable(vpZMids);

		const j = e.local();
		const y = e.local();
		const yBot = e.local();
		const yTop = e.local();

		yield e.set(j, 0);
		yield e.set(y, y0);
		yield e.set(yBot, e.gc.cur(zBot));
		yield e.set(yTop, e.gc.cur(zTop));
		yield e.while(e.lt(j, N), function*() {
			yield e.call(
				PlaceStrokeDist2,
				y.ptr,
				midBot(e, pZMids, j),
				midTop(e, pZMids, j),
				e.part(pGaps, j),
				e.part(pInks, j)
			);
			yield e.set(j, e.add(1, j));
		});
		yield e.scfs(zBot, yBot);
		yield e.scfs(zTop, yTop);
	}
);
