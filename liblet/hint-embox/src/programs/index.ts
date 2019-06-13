import { Expression, LibFunc, ProgramDsl, Template } from "@chlorophytum/hltt";

export interface StretchProps {
	readonly PIXEL_RATIO_TO_MOVE: number;
	readonly PIXEL_SHIFT_TO_MOVE: number;
	readonly STRETCH_BOTTOM_A: number;
	readonly STRETCH_BOTTOM_X: number;
	readonly STRETCH_TOP_A: number;
	readonly STRETCH_TOP_X: number;
	readonly CUTIN: number;
}

export const DefaultStretch: StretchProps = {
	PIXEL_RATIO_TO_MOVE: 1.7,
	PIXEL_SHIFT_TO_MOVE: 0.7,
	STRETCH_BOTTOM_A: -0.5,
	STRETCH_BOTTOM_X: 2.5,
	STRETCH_TOP_A: -0.5,
	STRETCH_TOP_X: 2.5,
	CUTIN: 0
};

const TDistAdjustBot = Template(
	"Chlorophytum::EmBox::HlttSupportPrograms::TDistAdjustBot",
	function*(e, stretch: StretchProps) {
		const [d] = e.args(1);
		const correctedPpem = e.max(
			e.coerce.toF26D6(1),
			e.add(
				e.coerce.toF26D6(stretch.STRETCH_BOTTOM_A),
				e.mul(e.coerce.toF26D6((stretch.STRETCH_BOTTOM_X * 64) / 12), e.mppem())
			)
		);
		yield e.return(
			e.max(
				0,
				e.mul(d, e.sub(e.coerce.toF26D6(1), e.div(e.coerce.toF26D6(1), correctedPpem)))
			)
		);
	}
);
const TDistAdjustTop = Template(
	"Chlorophytum::EmBox::HlttSupportPrograms::TDistAdjustTop",
	function*(e, stretch: StretchProps) {
		const [d] = e.args(1);
		const correctedPpem = e.max(
			e.coerce.toF26D6(1),
			e.add(
				e.coerce.toF26D6(stretch.STRETCH_TOP_A),
				e.mul(e.coerce.toF26D6((stretch.STRETCH_TOP_X * 64) / 12), e.mppem())
			)
		);
		yield e.return(
			e.max(
				0,
				e.mul(d, e.sub(e.coerce.toF26D6(1), e.div(e.coerce.toF26D6(1), correctedPpem)))
			)
		);
	}
);

const FOffsetMovementHasImprovement = LibFunc(
	"Chlorophytum::EmBox::HlttSupportPrograms::FOffsetMovementHasImprovement",
	function*($) {
		const [dOrig, dCur, sign] = $.args(3);
		yield $.return($.lteq($.abs($.sub($.add(sign, dCur), dOrig)), $.abs($.sub(dCur, dOrig))));
	}
);

function $TooMuch($: ProgramDsl, stretch: StretchProps, dCur: Expression, dOrig: Expression) {
	return $.or(
		$.gt(dCur, $.mul($.coerce.toF26D6(stretch.PIXEL_RATIO_TO_MOVE), dOrig)),
		$.gt(dCur, $.add($.coerce.toF26D6(stretch.PIXEL_SHIFT_TO_MOVE), dOrig))
	);
}
function $TooLess($: ProgramDsl, stretch: StretchProps, dCur: Expression, dOrig: Expression) {
	return $.or(
		$.lt(dCur, $.mul($.coerce.toF26D6(1 / stretch.PIXEL_RATIO_TO_MOVE), dOrig)),
		$.lt(dCur, $.add($.coerce.toF26D6(-stretch.PIXEL_SHIFT_TO_MOVE), dOrig))
	);
}

const TComputeOffsetPixelsForTBImpl = Template(
	"Chlorophytum::EmBox::HlttSupportPrograms::TComputeOffsetPixelsForTBImpl",
	function*($, stretch: StretchProps) {
		const [dOrig, dCur, sign] = $.args(3);

		yield $.if($.gt(dOrig, $.coerce.toF26D6(stretch.CUTIN)), function*() {
			yield $.if(
				$.and(
					$TooMuch($, stretch, dCur, dOrig),
					$.call(FOffsetMovementHasImprovement, dOrig, dCur, $.coerce.toF26D6(-1))
				),
				function*() {
					yield $.return($.mul($.coerce.toF26D6(-1), sign));
				}
			);
			yield $.if(
				$.and(
					$TooLess($, stretch, dCur, dOrig),
					$.call(FOffsetMovementHasImprovement, dOrig, dCur, $.coerce.toF26D6(+1))
				),
				function*() {
					yield $.return($.mul($.coerce.toF26D6(+1), sign));
				}
			);
		});

		yield $.return(0);
	}
);
const TComputeOffsetPixelsForTB = Template(
	"Chlorophytum::EmBox::HlttSupportPrograms::TComputeOffsetPixelsForTB",
	function*($, stretch: StretchProps) {
		const [dOrig, dCur, dOrigArch, dCurArch, sign] = $.args(5);

		const offset = $.local();
		yield $.set(offset, $.call(TComputeOffsetPixelsForTBImpl(stretch), dOrig, dCur, sign));
		yield $.if(offset, function*() {
			yield $.return(offset);
		});

		yield $.set(
			offset,
			$.call(TComputeOffsetPixelsForTBImpl(stretch), dOrigArch, dCurArch, sign)
		);
		yield $.if(offset, function*() {
			yield $.return(offset);
		});

		yield $.return(0);
	}
);

export const THintBottomStroke = Template(
	`Chlorophytum::EmBox::HlttSupportPrograms::THintBottomStroke`,
	function*($, stretch: StretchProps) {
		const [zBot, zTop, zaBot, zaTop, zsBot, zsTop] = $.args(6);

		// Perform a "free" position first -- we'd like to grab the positions
		yield $.call(THintBottomStrokeFree, zBot, zTop, zsBot, zsTop);

		const dOffset = $.local();

		yield $.set(
			dOffset,
			$.call(
				TComputeOffsetPixelsForTB(stretch),
				$.call(TDistAdjustBot(stretch), $.sub($.gc.orig(zsBot), $.gc.orig(zBot))),
				$.sub($.gc.cur(zsBot), $.gc.cur(zBot)),
				$.call(TDistAdjustBot(stretch), $.sub($.gc.orig(zsBot), $.gc.orig(zaBot))),
				$.sub($.gc.cur(zsBot), $.gc.cur(zaBot)),
				$.coerce.toF26D6(+1)
			)
		);

		yield $.scfs(zsBot, $.add($.gc.cur(zsBot), dOffset));
		yield $.scfs(zsTop, $.add($.gc.cur(zsTop), dOffset));
	}
);

export const THintBottomStrokeFree = LibFunc(
	`Chlorophytum::EmBox::HlttSupportPrograms::THintBottomStrokeFree`,
	function*(e) {
		const [zBot, zTop, zsBot, zsTop] = e.args(4);
		const dBelowOrig = e.local();
		const dAboveOrig = e.local();
		const wOrig = e.local();
		const wCur = e.local();
		const spaceCur = e.local();
		yield e.set(dBelowOrig, e.sub(e.gc.orig(zsBot), e.gc.orig(zBot)));
		yield e.set(dAboveOrig, e.sub(e.gc.orig(zTop), e.gc.orig(zsTop)));
		yield e.set(wOrig, e.sub(e.gc.orig(zsTop), e.gc.orig(zsBot)));
		yield e.set(wCur, e.max(e.coerce.toF26D6(3 / 5), wOrig));
		yield e.set(spaceCur, e.sub(e.sub(e.gc.cur(zTop), e.gc.cur(zBot)), wCur));
		yield e.scfs(
			zsBot,
			e.round.white(
				e.add(
					e.gc.cur(zBot),
					e.mul(spaceCur, e.div(dBelowOrig, e.add(dBelowOrig, dAboveOrig)))
				)
			)
		);
		yield e.scfs(zsTop, e.add(e.gc.cur(zsBot), wCur));
	}
);

export const THintTopStroke = Template(
	`Chlorophytum::EmBox::HlttSupportPrograms::THintTopStroke`,
	function*(e, stretch: StretchProps) {
		const [zBot, zTop, zaBot, zaTop, zsBot, zsTop] = e.args(6);

		// Perform a "free" position first -- we'd like to grab the positions
		yield e.call(THintTopStrokeFree, zBot, zTop, zsBot, zsTop);
		const dOffset = e.local();

		yield e.set(
			dOffset,
			e.call(
				TComputeOffsetPixelsForTB(stretch),
				e.call(TDistAdjustTop(stretch), e.sub(e.gc.orig(zTop), e.gc.orig(zsTop))),
				e.sub(e.gc.cur(zTop), e.gc.cur(zsTop)),
				e.call(TDistAdjustTop(stretch), e.sub(e.gc.orig(zaTop), e.gc.orig(zsTop))),
				e.sub(e.gc.cur(zaTop), e.gc.cur(zsTop)),
				e.coerce.toF26D6(-1)
			)
		);
		yield e.scfs(zsBot, e.add(e.gc.cur(zsBot), dOffset));
		yield e.scfs(zsTop, e.add(e.gc.cur(zsTop), dOffset));
	}
);

export const THintTopStrokeFree = LibFunc(
	`Chlorophytum::EmBox::HlttSupportPrograms::THintTopStrokeFree`,
	function*(e) {
		const [zBot, zTop, zsBot, zsTop] = e.args(4);
		const dBelowOrig = e.local();
		const dAboveOrig = e.local();
		const wOrig = e.local();
		const wCur = e.local();
		const spaceCur = e.local();
		yield e.set(dBelowOrig, e.sub(e.gc.orig(zsBot), e.gc.orig(zBot)));
		yield e.set(dAboveOrig, e.sub(e.gc.orig(zTop), e.gc.orig(zsTop)));
		yield e.set(wOrig, e.sub(e.gc.orig(zsTop), e.gc.orig(zsBot)));
		yield e.set(wCur, e.max(e.coerce.toF26D6(3 / 5), wOrig));
		yield e.set(spaceCur, e.sub(e.sub(e.gc.cur(zTop), e.gc.cur(zBot)), wCur));
		yield e.scfs(
			zsTop,
			e.round.white(
				e.sub(
					e.gc.cur(zTop),
					e.mul(spaceCur, e.div(dAboveOrig, e.add(dBelowOrig, dAboveOrig)))
				)
			)
		);
		yield e.scfs(zsBot, e.sub(e.gc.cur(zsTop), wCur));
	}
);

export const THintBottomEdge = LibFunc(
	`Chlorophytum::EmBox::HlttSupportPrograms::THintBottomEdge`,
	function*(e) {
		const [zBot, zTop, zsBot] = e.args(3);
		const adjustedDist = e.sub(e.gc.orig(zsBot), e.gc.orig(zBot));
		yield e.mdap(zsBot);
		yield e.scfs(zsBot, e.add(e.gc.cur(zBot), adjustedDist));
	}
);

export const THintTopEdge = LibFunc(
	`Chlorophytum::EmBox::HlttSupportPrograms::THintTopEdge`,
	function*(e) {
		const [zBot, zTop, zsTop] = e.args(3);
		const adjustedDist = e.sub(e.gc.orig(zTop), e.gc.orig(zsTop));
		yield e.mdap(zsTop);
		yield e.scfs(zsTop, e.sub(e.gc.cur(zTop), adjustedDist));
	}
);

export const RLink = LibFunc(
	`Chlorophytum::EmBox::HlttSupportPrograms::TInitEmBoxTwilightPoints::RLink`,
	function*($) {
		const [a, b] = $.args(2);
		yield $.scfs(b, $.add($.gc.cur(a), $.round.gray($.sub($.gc.orig(b), $.gc.orig(a)))));
	}
);

export const RLinkLim = LibFunc(
	`Chlorophytum::EmBox::HlttSupportPrograms::TInitEmBoxTwilightPoints::RLinkLim`,
	function*($) {
		const [a, b, c] = $.args(3);
		const dist = $.local();
		const absDist = $.local();
		const absDistC = $.local();
		yield $.set(dist, $.round.gray($.sub($.gc.orig(b), $.gc.orig(a))));
		yield $.set(absDist, $.abs(dist));
		yield $.set(absDistC, $.abs($.sub($.gc.orig(c), $.gc.orig(a))));
		yield $.while($.gt(absDist, absDistC), function*() {
			yield $.set(absDist, $.sub(absDist, $.coerce.toF26D6(1)));
		});
		yield $.if(
			$.gt(dist, 0),
			function*() {
				yield $.scfs(b, $.add($.gc.cur(a), absDist));
			},
			function*() {
				yield $.scfs(b, $.sub($.gc.cur(a), absDist));
			}
		);
	}
);

export const TInitEmBoxTwilightPoints = LibFunc(
	`Chlorophytum::EmBox::HlttSupportPrograms::TInitEmBoxTwilightPoints`,
	function*($) {
		const [strokeBottom, strokeTop, archBottom, archTop, spurBottom, spurTop] = $.args(6);
		// These MDAPs are not necessary but VTT loves them
		yield $.mdap(strokeBottom);
		yield $.mdap(strokeTop);
		yield $.mdap(archBottom);
		yield $.mdap(archTop);

		yield $.scfs(strokeBottom, $.round.black($.gc.orig(strokeBottom)));
		yield $.call(RLink, strokeBottom, strokeTop);
		yield $.mdrp(strokeBottom, spurBottom);
		yield $.mdrp(strokeTop, spurTop);
		yield $.call(RLinkLim, strokeBottom, archBottom, spurBottom);
		yield $.call(RLinkLim, strokeTop, archTop, spurTop);
	}
);

const InitEmBoxPointPrepImpl = LibFunc(
	`Chlorophytum::EmBox::HlttSupportPrograms::InitEmBoxPointPrepImpl`,
	function*($) {
		const [z, d] = $.args(2);
		yield $.scfs(z, $.div($.mul(d, $.toFloat($.mppem())), $.coerce.toF26D6(64)));
	}
);

export function TInitEmBoxPointPrep($: ProgramDsl, z: Expression, pos: number) {
	return $.call(InitEmBoxPointPrepImpl, z, $.coerce.toF26D6(pos * 64));
}
