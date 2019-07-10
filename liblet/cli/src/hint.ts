import { HintMain } from "@chlorophytum/arch";
import * as fs from "fs";

import { createEnv, HintOptions } from "./env";

export async function doHint(options: HintOptions, jobs: [string, string][]) {
	const env = createEnv(options);
	for (const [input, output] of jobs) {
		const otdStream = fs.createReadStream(input);
		const fontSource = await env.FontFormatPlugin.createFontSource(otdStream);
		const hs = await HintMain.preHint(fontSource, env.models, env.params);
		const out = fs.createWriteStream(output);
		await hs.save(out);
	}
}
