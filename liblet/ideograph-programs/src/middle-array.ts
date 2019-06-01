import { Template } from "@chlorophytum/hltt";

export const TInitMD = Template("IdeographProgram::TInitMD2", function*(
	e,
	N: number,
	md: number[]
) {
	const [vpMD] = e.args(1);
	const pMD = e.coerce.fromIndex.variable(vpMD, N);
	yield e.setArr(pMD, md.map(e.coerce.toF26D6));
});

export const TInitZMids = Template(`IdeographProgram::TInitZMids`, function*(e, N: number) {
	const [vpMD, ...zMids] = e.args(1 + 2 * N);
	const pMD = e.coerce.fromIndex.variable(vpMD, 2 * N);
	yield e.setArr(pMD, zMids);
});

export const TInitRecPath = Template("IdeographProgram::TInitRecPath", function*(
	e,
	N: number,
	recPath: number[]
) {
	const [vpMD] = e.args(1);
	const pMD = e.coerce.fromIndex.variable(vpMD, N);
	const recPath1: number[] = [];
	for (let j = 0; j < N; j++) recPath1[j] = recPath[j] || 0;
	yield e.setArr(pMD, recPath1);
});
