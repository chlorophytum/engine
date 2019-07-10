import * as fs from "fs";

import { createEnv, HintOptions } from "./env";

export async function doIntegrate(options: HintOptions, jobs: [string, string, string][]) {
	const env = createEnv(options);

	for (const [instr, input, output] of jobs) {
		const instrStream = fs.createReadStream(instr);
		const inputStream = fs.createReadStream(input);
		const outStream = fs.createWriteStream(output);
		await env.FontFormatPlugin.integrateFinalHintsToFont(instrStream, inputStream, outStream);
	}
}
