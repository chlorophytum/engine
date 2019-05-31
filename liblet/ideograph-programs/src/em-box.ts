import { LibFunc, ProgramDsl } from "@chlorophytum/hltt";

export const InitEmBox = LibFunc(`IdeographProgram::InitEmBox`, function*(e) {
	yield e.mdap.round(~2);
	yield e.mdrp.round(~2, ~3);
	yield e.mdrp(~2, ~0);
	yield e.mdrp(~3, ~1);
});
export const PSetupEmBox = function*(
	e: ProgramDsl,
	cBot: number,
	cTop: number,
	sBot: number,
	sTop: number
) {
	yield e.svtca.y();
	yield e.scfs(~0, e.mul(e.coerce.toF26D6(cBot), e.toFloat(e.mppem())));
	yield e.scfs(~1, e.mul(e.coerce.toF26D6(cTop), e.toFloat(e.mppem())));
	yield e.scfs(~2, e.mul(e.coerce.toF26D6(sBot), e.toFloat(e.mppem())));
	yield e.scfs(~3, e.mul(e.coerce.toF26D6(sTop), e.toFloat(e.mppem())));
};
