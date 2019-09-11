import { EmptyImpl, HintingPass, Plugins } from "@chlorophytum/arch";

export interface HintOptions {
	jobs?: number;
	fontFormat: string;
	finalFormat: string;
	hintStoreProvider: string;
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
export function getHintStoreProvider(hOpt: HintOptions) {
	const mFinalFormat: Plugins.HintStoreModule = require(hOpt.hintStoreProvider);
	return mFinalFormat.HintStoreProvider;
}
export function getHintingPasses(hOpt: HintOptions) {
	const passes: HintingPass[] = [];
	let passN = 0;

	for (const { plugin, options } of hOpt.hintPasses) {
		const mModel: Plugins.HintingModelModule = require(plugin);
		passes.push({
			uniqueID: `Pass${passN++}`,
			plugin: mModel.HintingModelPlugin,
			parameters: options
		});
	}

	// Pad with empty-impl
	passes.push({ uniqueID: `Pass${passN++}`, plugin: EmptyImpl.EmptyHintingModelFactory });

	return passes;
}
