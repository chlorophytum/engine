import { Expression, LibFunc, ProgramDsl, Variable } from "@chlorophytum/hltt";

const VIS_DIST_MAX = 4 / 5;
const VIS_DIST_MIN = 1 / 2 + 1 / 8;

export const VisFloor = LibFunc("IdeographProgram::visFloor", function*(e) {
	const [x, fillRate] = e.args(2);
	yield e.if(
		e.gteq(
			e.sub(x, e.floor(x)),
			e.max(e.coerce.toF26D6(VIS_DIST_MIN), e.min(e.coerce.toF26D6(VIS_DIST_MAX), fillRate))
		),
		function*() {
			yield e.return(e.add(e.coerce.toF26D6(1), e.floor(x)));
		},
		function*() {
			yield e.return(e.floor(x));
		}
	);
});
export const VisCeil = LibFunc("IdeographProgram::visCeil", function*(e) {
	const [x, fillRate] = e.args(2);
	yield e.if(
		e.gteq(
			e.sub(e.ceiling(x), x),
			e.max(e.coerce.toF26D6(VIS_DIST_MIN), e.min(e.coerce.toF26D6(VIS_DIST_MAX), fillRate))
		),
		function*() {
			yield e.return(e.sub(e.ceiling(x), e.coerce.toF26D6(1)));
		},
		function*() {
			yield e.return(e.ceiling(x));
		}
	);
});

export const VisDist = LibFunc("IdeographProgram::visDist", function*(e) {
	const [zBot, zTop, frBot, frTop] = e.args(4);
	yield e.return(
		e.sub(e.call(VisFloor, e.gc.cur(zTop), frTop), e.call(VisCeil, e.gc.cur(zBot), frBot))
	);
});

export const OctDistOrig = LibFunc("IdeographProgram::octDistOrig", function*(e) {
	const [zBot, zTop] = e.args(2);
	yield e.return(e.sub(e.gc.orig(zTop), e.gc.orig(zBot)));
});

function midBot(e: ProgramDsl, zMids: Variable, index: Expression) {
	return e.part(zMids, e.mul(e.coerce.toF26D6(2), index));
}
function midTop(e: ProgramDsl, zMids: Variable, index: Expression) {
	return e.part(zMids, e.add(1, e.mul(e.coerce.toF26D6(2), index)));
}
export const GetFillRate = LibFunc("IdeographProgram::GetFillRate", function*(e) {
	const [N, zBot, zTop, vpZMids] = e.args(4);
	const ink = e.local();
	const gap = e.local();

	const pZMids = e.coerce.fromIndex.variable(vpZMids);

	yield e.set(ink, 0);
	yield e.set(gap, 0);

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
		yield e.set(gap, e.add(gap, gapDist));
		yield e.set(j, e.add(1, j));
	});

	yield e.set(j, 0);
	yield e.while(e.lt(j, N), function*() {
		yield e.set(
			ink,
			e.add(ink, e.call(OctDistOrig, midBot(e, pZMids, j), midTop(e, pZMids, j)))
		);
		yield e.set(j, e.add(1, j));
	});

	yield e.return(e.div(gap, e.add(gap, ink)));
});
