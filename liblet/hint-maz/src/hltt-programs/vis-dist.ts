import { Expression, LibFunc, ProgramDsl, Variable } from "@chlorophytum/hltt";

const ConsideredDark = 3 / 5;

export const VisFloor = LibFunc("IdeographProgram::visFloor", function*($) {
	const [x, fillRate] = $.args(2);
	yield $.if(
		$.gteq($.sub(x, $.floor(x)), $.coerce.toF26D6(ConsideredDark)),
		function*() {
			yield $.return($.floor($.add($.coerce.toF26D6(1), $.floor(x))));
		},
		function*() {
			yield $.return($.floor($.floor(x)));
		}
	);
});
export const VisCeil = LibFunc("IdeographProgram::visCeil", function*($) {
	const [x, fillRate] = $.args(2);
	yield $.if(
		$.gteq($.sub($.ceiling(x), x), $.coerce.toF26D6(ConsideredDark)),
		function*() {
			yield $.return($.ceiling($.sub($.ceiling(x), $.coerce.toF26D6(1))));
		},
		function*() {
			yield $.return($.ceiling($.ceiling(x)));
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
export const GetFillRate = LibFunc("IdeographProgram::GetFillRate", function*($) {
	const [N, zBot, zTop, vpZMids] = $.args(4);
	const ink = $.local();
	const gap = $.local();

	const pZMids = $.coerce.fromIndex.variable(vpZMids);

	yield $.set(ink, 0);
	yield $.set(gap, 0);

	const j = $.local();
	const gapDist = $.local();
	yield $.set(j, 0);
	yield $.set(gapDist, 0);
	yield $.while($.lteq(j, N), function*() {
		yield $.if(
			$.eq(j, 0),
			function*() {
				yield $.set(gapDist, $.call(OctDistOrig, zBot, midBot($, pZMids, j)));
			},
			function*() {
				yield $.if(
					$.eq(j, N),
					function*() {
						yield $.set(
							gapDist,
							$.call(OctDistOrig, midTop($, pZMids, $.sub(j, 1)), zTop)
						);
					},
					function*() {
						yield $.set(
							gapDist,
							$.call(
								OctDistOrig,
								midTop($, pZMids, $.sub(j, 1)),
								midBot($, pZMids, j)
							)
						);
					}
				);
			}
		);
		yield $.set(gap, $.add(gap, gapDist));
		yield $.set(j, $.add(1, j));
	});

	yield $.set(j, 0);
	yield $.while($.lt(j, N), function*() {
		yield $.set(
			ink,
			$.add(ink, $.call(OctDistOrig, midBot($, pZMids, j), midTop($, pZMids, j)))
		);
		yield $.set(j, $.add(1, j));
	});

	yield $.return($.div(gap, $.add(gap, ink)));
});
