import { LibFunc, ProgramDsl } from "@chlorophytum/hltt";

export const InitEmBox = LibFunc(`IdeographProgram::InitEmBox`, function*(e) {
	yield e.mdap.round(~0);
	yield e.mdrp.round(~0, ~1);
	yield e.mdrp.round(~0, ~2);
	yield e.mdrp.round(~1, ~3);
});
export const PSetupEmBox = function*(
	e: ProgramDsl,
	cBot: number,
	cTop: number,
	sBot: number,
	sTop: number
) {
	yield e.svtca.y();
	yield e.scfs(~0, e.mul(e.coerce.toF26D6(cBot * e.coerce.toF26D6(1)), e.mppem()));
	yield e.scfs(~1, e.mul(e.coerce.toF26D6(sBot * e.coerce.toF26D6(1)), e.mppem()));
	yield e.scfs(~2, e.mul(e.coerce.toF26D6(cTop * e.coerce.toF26D6(1)), e.mppem()));
	yield e.scfs(~3, e.mul(e.coerce.toF26D6(sTop * e.coerce.toF26D6(1)), e.mppem()));
};
