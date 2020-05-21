import { Plugins } from "@chlorophytum/arch";

export interface ProcOptions {
	jobs?: number;
	fontFormat: string;
	finalFormat: string;
	hintStoreProvider: string;
	hintPlugin: string;
	hintOptions: any;
}

export function getFontPlugin(hOpt: ProcOptions) {
	const mFontFormat: Plugins.FontFormatModule = require(hOpt.fontFormat);
	return mFontFormat.FontFormatPlugin;
}
export function getFinalHintPlugin(hOpt: ProcOptions) {
	const mFinalFormat: Plugins.FinalHintModule = require(hOpt.finalFormat);
	return mFinalFormat.FinalHintPlugin;
}
export function getHintStoreProvider(hOpt: ProcOptions) {
	const mFinalFormat: Plugins.HintStoreModule = require(hOpt.hintStoreProvider);
	return mFinalFormat.HintStoreProvider;
}
export async function getHintingPasses(hOpt: ProcOptions) {
	const plugin: Plugins.HintingModelModule = require(hOpt.hintPlugin);
	return plugin.HintingModelPlugin.load(hOpt.hintOptions);
}
