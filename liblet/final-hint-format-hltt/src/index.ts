import { IFinalHintPlugin } from "@chlorophytum/arch";

import { HlttCollectorImpl } from "./collector";
import { createPreStatSink, HlttPreStatSink } from "./pre-stat-sink";

export * from "./pre-stat-sink";
export { CvtGenerator, HlttProgramSink, ProgramGenerator } from "./program-sink";
export { HlttCollector } from "./collector";
export { HlttSession, HlttFinalHintStoreRep } from "./session";

export const FinalHintPlugin: IFinalHintPlugin = {
	createFinalHintCollector(preStat) {
		const hlttPs = preStat.dynamicCast(HlttPreStatSink);
		if (hlttPs) return new HlttCollectorImpl(hlttPs);
		else throw new TypeError("Unreachable");
	},
	createPreStatSink: createPreStatSink
};
