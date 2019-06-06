import { LibFunc, Template } from "@chlorophytum/hltt";

import { BalanceStrokes } from "./balance";
import {
	InitMSDGapEntries,
	InitMSDInkEntries,
	MaxAverageLoop,
	MovePointsForMiddleHint
} from "./loop";
import { VisCeil } from "./vis-dist";

const GetInkDistFromTotalDist = LibFunc("IdeographProgram::getGapDistFromTotalDist", function*(e) {
	const [dCur, iOrig, gOrig, gReq, iReq] = e.args(5);
	yield e.return(
		e.min(
			e.sub(dCur, gReq),
			e.max(iReq, e.round.black(e.mul(dCur, e.div(iOrig, e.add(gOrig, iOrig)))))
		)
	);
});

export const DecideRequiredGap = LibFunc(`IdeographProgram::decideRequiredGap`, function*(e) {
	const [N, vpGapMD] = e.args(2);
	const pGapMD = e.coerce.fromIndex.variable(vpGapMD);
	const j = e.local();
	const s = e.local();
	yield e.set(j, 0);
	yield e.set(s, 0);
	yield e.while(e.lt(j, N), function*() {
		yield e.set(s, e.add(s, e.part(pGapMD, j)));
		yield e.set(j, e.add(j, 1));
	});
	yield e.return(s);
});

export const THintMultipleStrokesMidSize = Template(
	"IdeographProgram::THintMultipleStrokes::MidSize",
	function*(e, NMax: number) {
		const [N, dist, frBot, zBot, zTop, vpZMids, vpGapMD, vpInkMD] = e.args(8);

		const pxReqGap = e.local();
		const pxReqInk = e.local();
		yield e.set(pxReqGap, e.call(DecideRequiredGap, e.add(1, N), vpGapMD));
		yield e.set(pxReqInk, e.call(DecideRequiredGap, N, vpInkMD));

		const totalInk = e.local();
		const totalGap = e.local();
		const aGapDist = e.local(NMax + 1);
		const bGapDist = e.local(NMax + 1);
		const cGapDist = e.local(NMax + 1);
		const gapDivisor = e.local(NMax + 1);
		const gaps = e.local(NMax + 1);
		const gapOcc = e.local(NMax + 1);
		const aInkDist = e.local(NMax);
		const bInkDist = e.local(NMax);
		const cInkDist = e.local(NMax);
		const inkDivisor = e.local(NMax);
		const inks = e.local(NMax);
		const inkOcc = e.local(NMax);

		const scalar = e.local();
		yield e.set(scalar, e.div(dist, e.sub(e.gc.orig(zTop), e.gc.orig(zBot))));

		yield e.set(totalInk, 0);
		yield e.set(totalGap, 0);

		yield e.call(
			InitMSDGapEntries,
			N,
			totalGap.ptr,
			aGapDist.ptr,
			bGapDist.ptr,
			cGapDist.ptr,
			gapDivisor.ptr,
			gaps.ptr,
			zBot,
			zTop,
			vpZMids,
			vpGapMD
		);
		yield e.call(
			InitMSDInkEntries,
			N,
			totalInk.ptr,
			aInkDist.ptr,
			bInkDist.ptr,
			cInkDist.ptr,
			inkDivisor.ptr,
			inks.ptr,
			vpZMids,
			vpInkMD
		);

		const actualInk = e.local();
		yield e.set(
			actualInk,
			e.call(GetInkDistFromTotalDist, dist, totalInk, totalGap, pxReqGap, pxReqInk)
		);

		yield e.call(
			MaxAverageLoop,
			aGapDist.ptr,
			bGapDist.ptr,
			cGapDist.ptr,
			gapDivisor.ptr,
			gaps.ptr,
			e.add(1, N),
			scalar,
			e.sub(e.sub(dist, actualInk), pxReqGap)
		);
		yield e.call(
			MaxAverageLoop,
			aInkDist.ptr,
			bInkDist.ptr,
			cInkDist.ptr,
			inkDivisor.ptr,
			inks.ptr,
			N,
			scalar,
			e.sub(actualInk, pxReqInk)
		);

		// Balance
		yield e.call(
			BalanceStrokes,
			N,
			scalar,
			gapOcc.ptr,
			inkOcc.ptr,
			gaps.ptr,
			inks.ptr,
			aGapDist.ptr,
			aInkDist.ptr
		);

		yield e.call(
			MovePointsForMiddleHint,
			N,
			zBot,
			zTop,
			e.call(VisCeil, e.gc.cur(zBot), frBot),
			gaps.ptr,
			inks.ptr,
			vpZMids
		);
	}
);
