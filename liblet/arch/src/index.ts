import * as _EmptyImpl from "./empty-impl";
import {
	IFinalHintPlugin,
	IFontFormatPlugin,
	IHintingModelPlugin,
	IHintStoreProvider
} from "./interfaces";
import * as _Support from "./support/index";
export * from "./interfaces/index";
export * from "./logger";
export { WellKnownGlyphRelation } from "./well-known-relation";
export import EmptyImpl = _EmptyImpl;
export import Support = _Support;

export namespace Plugins {
	export interface FontFormatModule {
		readonly FontFormatPlugin: IFontFormatPlugin;
	}
	export interface HintStoreModule {
		readonly HintStoreProvider: IHintStoreProvider;
	}
	export interface HintingModelModule {
		readonly HintingModelPlugin: IHintingModelPlugin;
	}
	export interface FinalHintModule {
		readonly FinalHintPlugin: IFinalHintPlugin;
	}
}
