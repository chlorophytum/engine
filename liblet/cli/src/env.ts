import { HintingModelConfig, IHintingModelPlugin, Plugins } from "@chlorophytum/arch";

export interface HintOptions {
	fontFormat: string;
	finalFormat: string;
	hintPasses: { plugin: string; options?: any }[];
}

export function createEnv(hOpt: HintOptions) {
	const mFontFormat: Plugins.FontFormatModule = require(hOpt.fontFormat);
	const mFinalFormat: Plugins.FinalHintModule = require(hOpt.finalFormat);
	const models: IHintingModelPlugin[] = [];
	const params: HintingModelConfig[] = [];

	for (const { plugin, options } of hOpt.hintPasses) {
		const mModel: Plugins.HintingModelModule = require(plugin);
		models.push(mModel.HintingModelPlugin);
		params.push({ type: mModel.HintingModelPlugin.type, parameters: options });
	}

	return {
		FontFormatPlugin: mFontFormat.FontFormatPlugin,
		FinalHintPlugin: mFinalFormat.FinalHintPlugin,
		models,
		params
	};
}
