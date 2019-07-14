import { EmptyImpl, HintingModelConfig, IHintingModelPlugin, Plugins } from "@chlorophytum/arch";

export interface HintOptions {
	fontFormat: string;
	finalFormat: string;
	hintPasses: { plugin: string; options?: any }[];
}

export function getFontPlugin(hOpt: HintOptions) {
	const mFontFormat: Plugins.FontFormatModule = require(hOpt.fontFormat);
	return mFontFormat.FontFormatPlugin;
}
export function getFinalHintPlugin(hOpt: HintOptions) {
	const mFinalFormat: Plugins.FinalHintModule = require(hOpt.finalFormat);
	return mFinalFormat.FinalHintPlugin;
}
export function getHintingModelsAndParams(hOpt: HintOptions) {
	const models: IHintingModelPlugin[] = [];
	const params: HintingModelConfig[] = [];

	for (const { plugin, options } of hOpt.hintPasses) {
		const mModel: Plugins.HintingModelModule = require(plugin);
		models.push(mModel.HintingModelPlugin);
		params.push({ type: mModel.HintingModelPlugin.type, parameters: options });
	}

	// Pad with empty-impl
	models.push(EmptyImpl.EmptyHintingModelFactory);
	params.push({ type: EmptyImpl.EmptyHintingModelFactory.type });

	return { models, params };
}
