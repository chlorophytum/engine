import { LibFunc } from "@chlorophytum/hltt";

export const ProcessCollidedStrokeWidth = LibFunc(
	"IdeographProgram::ProcessCollidedStrokeWidth",
	function*(e) {
		const [w0] = e.args(1);
		yield e.return(e.max(e.coerce.toF26D6(1 / 2), e.mul(e.coerce.toF26D6(1 / 2), w0)));
	}
);

export const CollideHangBottom = LibFunc(`IdeographProgram::CollideHangBottom`, function*(e) {
	const [botLim, botCur, topCur] = e.args(3);
	yield e.scfs(botCur, e.gc.cur(botLim));
	yield e.scfs(
		topCur,
		e.add(
			e.round.gray(e.gc.cur(botLim)),
			e.call(ProcessCollidedStrokeWidth, e.sub(e.gc.orig(topCur), e.gc.orig(botCur)))
		)
	);
});
export const CollideHangTop = LibFunc(`IdeographProgram::CollideHangTop`, function*(e) {
	const [topLim, botCur, topCur] = e.args(3);
	yield e.scfs(topCur, e.gc.cur(topLim));
	yield e.scfs(
		botCur,
		e.sub(
			e.round.gray(e.gc.cur(topLim)),
			e.call(ProcessCollidedStrokeWidth, e.sub(e.gc.orig(topCur), e.gc.orig(botCur)))
		)
	);
});

export const AlignTwoStrokes = LibFunc(`IdeographProgram::AlignTwoStrokes`, function*($) {
	const [a, b, c, d] = $.args(4);
	yield $.scfs(a, $.gc.cur(c));
	yield $.scfs(b, $.gc.cur(d));
});
export const CollideDownTwoStrokes = LibFunc(`IdeographProgram::collideDownTwoStrokes`, function*(
	e
) {
	const [botCur, topCur, botBelow, topBelow] = e.args(4);
	yield e.scfs(botCur, e.add(e.coerce.toF26D6(1), e.gc.cur(botBelow)));
	yield e.scfs(
		topCur,
		e.add(
			e.gc.cur(botCur),
			e.call(ProcessCollidedStrokeWidth, e.sub(e.gc.cur(topBelow), e.gc.cur(botBelow)))
		)
	);
});
export const CollideUpTwoStrokes = LibFunc(`IdeographProgram::collideUpTwoStrokes`, function*(e) {
	const [botCur, topCur, botAbove, topAbove] = e.args(4);
	yield e.scfs(botCur, e.sub(e.gc.cur(botAbove), e.coerce.toF26D6(1)));
	yield e.scfs(
		topCur,
		e.add(
			e.gc.cur(botCur),
			e.call(ProcessCollidedStrokeWidth, e.sub(e.gc.cur(topAbove), e.gc.cur(botAbove)))
		)
	);
});
