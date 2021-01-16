import { IFinalHintFormat, IFinalHintPreStatSink } from "@chlorophytum/arch";

import { HlttCollectorImpl } from "./collector";
import { createPreStatSink, HlttPreStatSink } from "./pre-stat-sink";

export { HlttCollector } from "./collector";
export * from "./pre-stat-sink";
export { CvtGenerator, HlttProgramSink, ProgramGenerator } from "./program-sink";
export { HlttFinalHintStoreRep, HlttSession } from "./session";

export class CHlttFinalHintFormat implements IFinalHintFormat {
	async createFinalHintCollector(preStat: IFinalHintPreStatSink) {
		const hlttPs = preStat.dynamicCast(HlttPreStatSink);
		if (hlttPs) return new HlttCollectorImpl(hlttPs);
		else throw new TypeError("Unreachable");
	}
	async createPreStatSink() {
		return createPreStatSink();
	}
}
