import * as _EmptyImpl from "./empty-impl";
import { IFinalHintPlugin, IFontFormatPlugin, IHintingModelPlugin } from "./interfaces";
import { mainMidHint } from "./main/mid-hint";
import mainPreHint from "./main/pre-hint";
import * as _Support from "./support/index";

export * from "./interfaces/index";
export import EmptyImpl = _EmptyImpl;
export import Support = _Support;

export namespace HintMain {
	export const preHint = mainPreHint;
	export const midHint = mainMidHint;
}

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
