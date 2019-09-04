import { IFinalHintPlugin } from "@chlorophytum/arch";
import { TtStat } from "@chlorophytum/hltt";

import { HlttCollector, HlttPreStatSink } from "./sink";

export * from "./sink";

export const FinalHintPlugin: IFinalHintPlugin = {
	createFinalHintCollector(preStat) {
		if (preStat instanceof HlttPreStatSink) return new HlttCollector(preStat);
		else throw new TypeError("Unreachable");
	},
	createPreStatSink: () => new HlttPreStatSink()
};
