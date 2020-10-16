import { Plugins } from "@chlorophytum/arch";
import * as Module from "module";

export interface ProcOptions {
	jobs?: number;
	resolutionBase: string;
	fontFormat: string;
	fontFormatOptions?: any;
	hintStoreProvider: string;
	hintStoreProviderOptions?: any;
	hintPlugin: string;
	hintOptions?: any;
}

class NodeJsLoader implements Plugins.IAsyncModuleLoader {
	private m_require: NodeRequire;
	constructor(base: string) {
		this.m_require = Module.createRequire(base);
	}
	async import<T>(path: string): Promise<T> {
		return this.m_require(path) as T;
	}
}

export async function getFontPlugin(hOpt: ProcOptions) {
	const loader = new NodeJsLoader(hOpt.resolutionBase);
	const mFontFormat = await loader.import<Plugins.FontFormatModule>(hOpt.fontFormat);
	return await mFontFormat.FontFormatPlugin.load(loader, hOpt.fontFormatOptions);
}
export async function getHintStoreProvider(hOpt: ProcOptions) {
	const loader = new NodeJsLoader(hOpt.resolutionBase);
	const mFinalFormat = await loader.import<Plugins.HintStoreModule>(hOpt.hintStoreProvider);
	return await mFinalFormat.HintStoreProviderPlugin.load(loader, hOpt.hintStoreProviderOptions);
}
export async function getHintingPasses(hOpt: ProcOptions) {
	const loader = new NodeJsLoader(hOpt.resolutionBase);
	const plugin = await loader.import<Plugins.HintingModelModule>(hOpt.hintPlugin);
	return await plugin.HintingModelPlugin.load(loader, hOpt.hintOptions);
}
