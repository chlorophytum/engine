import {
	IFontSource,
	IFontSourceMetadata,
	IHintingModel,
	IHintingModelPlugin
} from "@chlorophytum/arch";
import { Interpolate, LinkChain, Smooth, WithDirection } from "@chlorophytum/hint-common";
import { EmBoxEdge, EmBoxInit, EmBoxShared, EmBoxStroke } from "@chlorophytum/hint-embox";
import { MultipleAlignZone } from "@chlorophytum/hint-maz";

import { IdeographHintingModel1, IdeographParallelHintingModel1 } from "./hinting-model";

class CIdeographHintingModelFactory1 implements IHintingModelPlugin {
	public readonly type = "Chlorophytum::IdeographHintingModel1";
	public adopt<GID>(
		font: IFontSource<GID>,
		parameters: any
	): IHintingModel<GID> | null | undefined {
		return new IdeographHintingModel1<GID>(font, parameters);
	}
	public adoptParallel(metadata: IFontSourceMetadata, parameters: any) {
		return new IdeographParallelHintingModel1(metadata, parameters);
	}
	public readonly hintFactories = [
		new WithDirection.HintFactory(),
		new MultipleAlignZone.HintFactory(),
		new LinkChain.HintFactory(),
		new Interpolate.HintFactory(),
		new EmBoxStroke.HintFactory(),
		new EmBoxEdge.HintFactory(),
		new EmBoxInit.HintFactory(),
		new EmBoxShared.HintFactory(),
		new Smooth.HintFactory()
	];
}

const IdeographHintingModelFactory1: IHintingModelPlugin = new CIdeographHintingModelFactory1();

export default IdeographHintingModelFactory1;
