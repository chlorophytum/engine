import { IFinalHintPlugin } from "@chlorophytum/arch";

import { HlttCollector } from "./sink";

export * from "./sink";

export const FinalHintPlugin: IFinalHintPlugin = {
	createFinalHintCollector: () => new HlttCollector()
};
