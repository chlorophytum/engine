import { LibFunc } from "@chlorophytum/hltt";

export const CollideDownTwoStrokes = LibFunc(`IdeographProgram::collideDownTwoStrokes`, function*(e) {
	const [botCur, topCur, botBelow, topBelow] = e.args(4);
	yield e.scfs(botCur, e.add(e.coerce.toF26D6(1), e.gc.cur(botBelow)));
	yield e.scfs(
		topCur,
		e.add(
			e.gc.cur(botCur),
			e.min(
				e.coerce.toF26D6(1 / 2),
				e.mul(e.coerce.toF26D6(1 / 2), e.sub(e.gc.cur(topBelow), e.gc.cur(botBelow)))
			)
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
			e.min(
				e.coerce.toF26D6(1 / 2),
				e.mul(e.coerce.toF26D6(1 / 2), e.sub(e.gc.cur(topAbove), e.gc.cur(botAbove)))
			)
		)
	);
});
