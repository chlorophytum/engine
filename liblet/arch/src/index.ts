import * as _EmptyImpl from "./empty-impl";
import { IFinalHintPlugin, IFontFormatPlugin, IHintingModelPlugin } from "./interfaces";
import * as _Support from "./support/index";
export * from "./interfaces/index";
export { WellKnownGlyphRelation } from "./well-known-relation";
export * from "./logger";
export import EmptyImpl = _EmptyImpl;
export import Support = _Support;

export namespace Plugins {
	export interface FontFormatModule {
		FontFormatPlugin: IFontFormatPlugin;
	}
	export interface HintingModelModule {
		HintingModelPlugin: IHintingModelPlugin;
	}
	export interface FinalHintModule {
		FinalHintPlugin: IFinalHintPlugin;
	}
}
