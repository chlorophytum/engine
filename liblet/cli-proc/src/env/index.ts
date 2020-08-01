import { Plugins } from "@chlorophytum/arch";

export interface ProcOptions {
	jobs?: number;
	fontFormat: string;
	fontFormatOptions?: any;
	finalFormat: string;
	finalFormatOptions?: any;
	hintStoreProvider: string;
	hintStoreProviderOptions?: any;
	hintPlugin: string;
	hintOptions?: any;
}

const CJS: Plugins.IAsyncModuleLoader = {
	async import<T>(path: string): Promise<T> {
		return require(path) as T;
	},
};

export async function getFontPlugin(hOpt: ProcOptions) {
	const mFontFormat = await CJS.import<Plugins.FontFormatModule>(hOpt.fontFormat);
	return await mFontFormat.FontFormatPlugin.load(CJS, hOpt.fontFormatOptions);
}
export async function getFinalHintPlugin(hOpt: ProcOptions) {
	const mFinalFormat = await CJS.import<Plugins.FinalHintModule>(hOpt.finalFormat);
	return await mFinalFormat.FinalHintFormatPlugin.load(CJS, hOpt.finalFormatOptions);
}
export async function getHintStoreProvider(hOpt: ProcOptions) {
	const mFinalFormat = await CJS.import<Plugins.HintStoreModule>(hOpt.hintStoreProvider);
	return await mFinalFormat.HintStoreProviderPlugin.load(CJS, hOpt.hintStoreProviderOptions);
}
export async function getHintingPasses(hOpt: ProcOptions) {
	const plugin = await CJS.import<Plugins.HintingModelModule>(hOpt.hintPlugin);
	return await plugin.HintingModelPlugin.load(CJS, hOpt.hintOptions);
}
