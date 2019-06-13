import { EmptyImpl } from "@chlorophytum/arch";
import { EmBoxShared } from "@chlorophytum/hint-embox";

import { HintingStrategy } from "./strategy";

export function createSharedHints(params: HintingStrategy) {
	return new EmptyImpl.Sequence.Hint([
		new EmBoxShared.Hint({
			name: params.groupName,
			strokeBottom: params.EMBOX_BOTTOM_STROKE,
			strokeTop: params.EMBOX_TOP_STROKE,
			archBottom: params.EMBOX_BOTTOM_ARCH,
			archTop: params.EMBOX_TOP_ARCH,
			spurBottom: params.EMBOX_BOTTOM_SPUR,
			spurTop: params.EMBOX_TOP_SPUR
		})
	]);
}
