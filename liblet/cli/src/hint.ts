import { Plugins } from "@chlorophytum/arch";

export interface HintOptions {
	fontFormat: string;
	hintPasses: [string, string][];
	processes: [string, string][];
}

export async function doHint(options: HintOptions) {
	const mFontFormat: Plugins.FontFormatModule = require(options.fontFormat);
}
