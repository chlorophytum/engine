import { IFinalHintPlugin } from "@chlorophytum/arch";

import { HlttCollector } from "./sink";

export * from "./sink";

export const Plugin: IFinalHintPlugin = {
	createFinalHintCollector: () => new HlttCollector()
};
