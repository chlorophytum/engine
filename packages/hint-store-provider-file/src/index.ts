import { Plugins } from "@chlorophytum/arch";

import { HintStoreFsProvider } from "./provider";

export const HintStoreProviderPlugin: Plugins.IHintStoreProviderPlugin = {
	load: async () => new HintStoreFsProvider()
};
