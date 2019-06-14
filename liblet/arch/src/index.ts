import * as _EmptyImpl from "./empty-impl";
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
