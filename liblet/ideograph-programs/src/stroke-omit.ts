import { LibFunc } from "@chlorophytum/hltt";

const ProcessCollidedStrokeWidth = LibFunc(
	"IdeographProgram::ProcessCollidedStrokeWidth",
	function*(e) {
		const [w0] = e.args(1);
		yield e.return(e.max(e.coerce.toF26D6(1 / 2), e.mul(e.coerce.toF26D6(1 / 2), w0)));
	}
);

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
