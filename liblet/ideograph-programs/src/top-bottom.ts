import { LibFunc } from "@chlorophytum/hltt";

const DistAdjust = LibFunc("IdeographProgram::DistAdjust", function*(e) {
	const [d] = e.args(1);
	yield e.return(
		e.max(
			0,
			e.mul(
				d,
				e.sub(
					e.coerce.toF26D6(1),
					e.div(
						64,
						e.max(e.coerce.toF26D6(1), e.mul(e.coerce.toF26D6(64), e.add(1, e.mppem())))
					)
				)
			)
		)
	);
});

export const THintBottomStroke = LibFunc(`IdeographProgram::THintBottomStroke`, function*(e) {
	const [zBot, zTop, zsBot, zsTop] = e.args(4);
	const adjustedDist = e.call(DistAdjust, e.sub(e.gc.orig(zsBot), e.gc.orig(zBot)));
	yield e.mdap(zsBot);
	const y1 = e.local();
	yield e.set(y1, e.round.white(e.add(e.gc.cur(zBot), adjustedDist)));
	yield e.if(
		e.gteq(
			e.sub(y1, e.gc.cur(zBot)),
			e.mul(e.coerce.toF26D6(1.75), e.sub(e.gc.orig(zsBot), e.gc.orig(zBot)))
		),
		function*() {
			yield e.set(y1, e.sub(y1, e.coerce.toF26D6(1)));
		}
	);
	yield e.if(
		e.lt(y1, e.gc.cur(zBot)),
		function*() {
			yield e.scfs(zsBot, e.add(y1, e.coerce.toF26D6(1)));
		},
		function*() {
			yield e.scfs(zsBot, y1);
		}
	);
	yield e.mdrp.black(zsBot, zsTop);
	yield e.if(e.gt(e.coerce.toF26D6(3 / 5), e.sub(e.gc.cur(zsTop), e.gc.cur(zsBot))), function*() {
		yield e.scfs(zsTop, e.add(e.gc.cur(zsBot), e.coerce.toF26D6(3 / 5)));
	});
});

export const THintTopStroke = LibFunc(`IdeographProgram::THintTopStroke`, function*(e) {
	const [zBot, zTop, zsBot, zsTop] = e.args(4);
	const adjustedDist = e.call(DistAdjust, e.sub(e.gc.orig(zTop), e.gc.orig(zsTop)));
	yield e.mdap(zsTop);
	const y1 = e.local();
	yield e.set(y1, e.round.white(e.sub(e.gc.cur(zTop), adjustedDist)));
	yield e.if(
		e.gteq(
			e.sub(e.gc.cur(zTop), y1),
			e.mul(e.coerce.toF26D6(1.75), e.sub(e.gc.orig(zTop), e.gc.orig(zsTop)))
		),
		function*() {
			yield e.set(y1, e.add(y1, e.coerce.toF26D6(1)));
		}
	);
	yield e.if(
		e.gt(y1, e.add(e.coerce.toF26D6(1 / 2), e.gc.cur(zTop))),
		function*() {
			yield e.scfs(zsTop, e.sub(y1, e.coerce.toF26D6(1)));
		},
		function*() {
			yield e.scfs(zsTop, y1);
		}
	);
	yield e.mdrp.black(zsTop, zsBot);
	yield e.if(e.gt(e.coerce.toF26D6(3 / 5), e.sub(e.gc.cur(zsTop), e.gc.cur(zsBot))), function*() {
		yield e.scfs(zsBot, e.sub(e.gc.cur(zsTop), e.coerce.toF26D6(3 / 5)));
	});
});

export const THintBottomEdge = LibFunc(`IdeographProgram::THintBottomEdge`, function*(e) {
	const [zBot, zTop, zsBot] = e.args(3);
	const adjustedDist = e.call(DistAdjust, e.sub(e.gc.orig(zsBot), e.gc.orig(zBot)));
	yield e.mdap(zsBot);
	yield e.scfs(zsBot, e.add(e.gc.cur(zBot), adjustedDist));
});

export const THintTopEdge = LibFunc(`IdeographProgram::THintTopEdge`, function*(e) {
	const [zBot, zTop, zsTop] = e.args(3);
	const adjustedDist = e.call(DistAdjust, e.sub(e.gc.orig(zTop), e.gc.orig(zsTop)));
	yield e.mdap(zsTop);
	yield e.scfs(zsTop, e.sub(e.gc.cur(zTop), adjustedDist));
});
