import { IFinalHintFormat } from "@chlorophytum/arch";

import { HlttCollectorImpl, HlttCollectorOptions } from "./collector";

export { HlttCollector, HlttCollectorOptions } from "./collector";
export * from "./pre-stat-sink";
export { CvtGenerator, HlttProgramSink, ProgramGenerator } from "./program-sink";
export { HlttFinalHintStoreRep, HlttSession } from "./session";

export interface HlttFinalHintFormatOptions extends HlttCollectorOptions {}

export class CHlttFinalHintFormat implements IFinalHintFormat {
	public constructor(private readonly options: HlttFinalHintFormatOptions) {}
	async createFinalHintSink() {
		return new HlttCollectorImpl(this.options);
	}
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public static rectifyOptions(options: any): HlttFinalHintFormatOptions {
		return {
			generateRelocatableCode: options?.generateRelocatableCode,
			stackPointerStorageID: options?.stackPointerStorageID
		};
	}
}
