import { EmptyImpl } from "@chlorophytum/arch";
import { EmBoxShared } from "@chlorophytum/hint-embox";

import HintingStrategy from "./strategy";

export function createSharedHints(params: HintingStrategy) {
	return new EmptyImpl.Sequence.Hint([
		new EmBoxShared.Hint({
			name: params.groupName,
			strokeBottom: params.EMBOX_BOTTOM_STROKE / params.UPM,
			strokeTop: params.EMBOX_TOP_STROKE / params.UPM,
			spurBottom: params.EMBOX_BOTTOM_SPUR / params.UPM,
			spurTop: params.EMBOX_TOP_SPUR / params.UPM
		})
	]);
}
