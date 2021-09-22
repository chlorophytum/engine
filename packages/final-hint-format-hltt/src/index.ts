import { IFinalHintFormat } from "@chlorophytum/arch";

import { HlttCollectorImpl } from "./collector";

export { HlttCollector } from "./collector";
export * from "./pre-stat-sink";
export { CvtGenerator, HlttProgramSink, ProgramGenerator } from "./program-sink";
export { HlttFinalHintStoreRep, HlttSession } from "./session";

export class CHlttFinalHintFormat implements IFinalHintFormat {
	async createFinalHintSink() {
		return new HlttCollectorImpl();
	}
}
