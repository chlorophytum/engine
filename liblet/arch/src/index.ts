import * as _BuiltInCombinators from "./combinators";
import { IFinalHintFormat, IFontFormat, IHintingPass, IHintStoreProvider } from "./interfaces";
import * as _Support from "./support/index";
export * from "./interfaces/index";
export * from "./logger";
export { WellKnownGeometryKind, WellKnownGlyphRelation } from "./well-known-relation";

export import Support = _Support;
export import BuiltInCombinators = _BuiltInCombinators;

export namespace Plugins {
	export interface IAsyncModuleLoader {
		import<T>(path: string): Promise<T>;
	}
	export interface IPlugin<T> {
		load(loader: IAsyncModuleLoader, parameters: any): Promise<T>;
	}

	export type IFontFormatPlugin = IPlugin<IFontFormat>;
	export interface FontFormatModule {
		readonly FontFormatPlugin: IFontFormatPlugin;
	}

	export type IHintStoreProviderPlugin = IPlugin<IHintStoreProvider>;
	export interface HintStoreModule {
		readonly HintStoreProviderPlugin: IHintStoreProviderPlugin;
	}

	export type IHintingModelPlugin = IPlugin<IHintingPass>;
	export interface HintingModelModule {
		readonly HintingModelPlugin: IHintingModelPlugin;
	}

	export type IFinalHintFormatPlugin = IPlugin<IFinalHintFormat>;
	export interface FinalHintModule {
		readonly FinalHintFormatPlugin: IFinalHintFormatPlugin;
	}
}
