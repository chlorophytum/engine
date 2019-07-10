import { HintMain } from "@chlorophytum/arch";
import * as fs from "fs";

import { getFontPlugin, getHintingModelsAndParams, HintOptions } from "./env";

export async function doHint(options: HintOptions, jobs: [string, string][]) {
	const FontFormatPlugin = getFontPlugin(options);
	const { models, params } = getHintingModelsAndParams(options);
	for (const [input, output] of jobs) {
		const otdStream = fs.createReadStream(input);
		const fontSource = await FontFormatPlugin.createFontSource(otdStream);
		const hs = await HintMain.preHint(fontSource, models, params);
		const out = fs.createWriteStream(output);
		await hs.save(out);
	}
}
