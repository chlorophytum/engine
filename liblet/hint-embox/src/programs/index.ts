import { LibFunc, Template } from "@chlorophytum/hltt";

export interface StretchProps {
	readonly PIXEL_RATIO_TO_MOVE: number;
	readonly PIXEL_SHIFT_TO_MOVE: number;
	readonly STRETCH_BOTTOM_A: number;
	readonly STRETCH_BOTTOM_X: number;
	readonly STRETCH_TOP_A: number;
	readonly STRETCH_TOP_X: number;
}

export const DefaultStretch: StretchProps = {
	PIXEL_RATIO_TO_MOVE: 1.7,
	PIXEL_SHIFT_TO_MOVE: 0.7,
	STRETCH_BOTTOM_A: -0.5,
	STRETCH_BOTTOM_X: 2.5,
	STRETCH_TOP_A: -6,
	STRETCH_TOP_X: 8
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
	function*(e) {
		const [dOrig, dCur, sign] = e.args(3);
		yield e.return(e.lteq(e.abs(e.sub(e.add(sign, dCur), dOrig)), e.abs(e.sub(dCur, dOrig))));
	}
);
const TComputeOffsetPixelsForTB = Template(
	"Chlorophytum::EmBox::HlttSupportPrograms::TComputeOffsetPixelsForTB",
	function*(e, stretch: StretchProps) {
		const [dOrig, dCur, sign] = e.args(3);
		const dOffset = e.local();

		const $tooMuch = e.or(
			e.gt(dCur, e.mul(e.coerce.toF26D6(stretch.PIXEL_RATIO_TO_MOVE), dOrig)),
			e.gt(dCur, e.add(e.coerce.toF26D6(stretch.PIXEL_SHIFT_TO_MOVE), dOrig))
		);
		const $tooLess = e.or(
			e.lt(dCur, e.mul(e.coerce.toF26D6(1 / stretch.PIXEL_RATIO_TO_MOVE), dOrig)),
			e.lt(dCur, e.add(e.coerce.toF26D6(-stretch.PIXEL_SHIFT_TO_MOVE), dOrig))
		);

		yield e.set(dOffset, 0);
		yield e.if(
			e.and(
				$tooMuch,
				e.call(FOffsetMovementHasImprovement, dOrig, dCur, e.coerce.toF26D6(-1))
			),
			function*() {
				yield e.set(dOffset, e.mul(e.coerce.toF26D6(-1), sign));
			},
			function*() {
				yield e.if(
					e.and(
						$tooLess,
						e.call(FOffsetMovementHasImprovement, dOrig, dCur, e.coerce.toF26D6(+1))
					),
					function*() {
						yield e.set(dOffset, e.mul(e.coerce.toF26D6(+1), sign));
					}
				);
			}
		);

		yield e.return(dOffset);
	}
);

export const THintBottomStroke = Template(
	`Chlorophytum::EmBox::HlttSupportPrograms::THintBottomStroke`,
	function*(e, stretch: StretchProps) {
		const [zBot, zTop, zsBot, zsTop] = e.args(4);

		// Perform a "free" position first -- we'd like to grab the positions
		yield e.call(THintBottomStrokeFree, zBot, zTop, zsBot, zsTop);

		const dBelowOrig = e.local();
		const dBelowCur = e.local();
		const dOffset = e.local();
		yield e.set(
			dBelowOrig,
			e.call(TDistAdjustBot(stretch), e.sub(e.gc.orig(zsBot), e.gc.orig(zBot)))
		);
		yield e.set(dBelowCur, e.sub(e.gc.cur(zsBot), e.gc.cur(zBot)));
		yield e.set(
			dOffset,
			e.call(TComputeOffsetPixelsForTB(stretch), dBelowOrig, dBelowCur, e.coerce.toF26D6(+1))
		);

		yield e.scfs(zsBot, e.add(e.gc.cur(zsBot), dOffset));
		yield e.scfs(zsTop, e.add(e.gc.cur(zsTop), dOffset));
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
		const [zBot, zTop, zsBot, zsTop] = e.args(4);

		// Perform a "free" position first -- we'd like to grab the positions
		yield e.call(THintTopStrokeFree, zBot, zTop, zsBot, zsTop);

		const dAboveOrig = e.local();
		const dAboveCur = e.local();
		const dOffset = e.local();
		yield e.set(
			dAboveOrig,
			e.call(TDistAdjustTop(stretch), e.sub(e.gc.orig(zTop), e.gc.orig(zsTop)))
		);
		yield e.set(dAboveCur, e.sub(e.gc.cur(zTop), e.gc.cur(zsTop)));
		yield e.set(
			dOffset,
			e.call(TComputeOffsetPixelsForTB(stretch), dAboveOrig, dAboveCur, e.coerce.toF26D6(-1))
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

export const TInitEmBoxTwilightPoints = LibFunc(
	`Chlorophytum::EmBox::HlttSupportPrograms::TInitEmBoxTwilightPoints`,
	function*($) {
		const [strokeBottom, strokeTop, spurBottom, spurTop] = $.args(4);
		yield $.mdap.round(strokeBottom);
		yield $.mdap(strokeTop); // Make VTT happy
		const dist = $.local();
		yield $.set(dist, $.round.gray($.sub($.gc.orig(strokeTop), $.gc.orig(strokeBottom))));
		yield $.scfs(strokeTop, $.add($.gc.cur(strokeBottom), dist));
		yield $.mdap.round(strokeTop);
		yield $.mdrp(strokeBottom, spurBottom);
		yield $.mdrp(strokeTop, spurTop);
	}
);
