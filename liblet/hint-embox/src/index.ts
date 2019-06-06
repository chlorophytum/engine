import { PREFIX } from "./constants";

export * from "./em-box-init";
export * from "./em-box-shared";
export * from "./stroke-hint";
export * from "./edge-hint";

export function TranslateEmboxTwilightName(boxName: string, pointName: string) {
	return `${PREFIX}::${boxName}::${pointName}`;
}
