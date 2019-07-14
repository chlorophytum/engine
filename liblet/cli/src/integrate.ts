import * as fs from "fs";

import { getFontPlugin, HintOptions } from "./env";

export type IntegrateJob = [string, string, string];
export async function doIntegrate(options: HintOptions, jobs: [string, string, string][]) {
	const FontFormatPlugin = getFontPlugin(options);

	for (const [instr, input, output] of jobs) {
		const instrStream = fs.createReadStream(instr);
		const inputStream = fs.createReadStream(input);
		const outStream = fs.createWriteStream(output);
		await FontFormatPlugin.integrateFinalHintsToFont(instrStream, inputStream, outStream);
	}
}
