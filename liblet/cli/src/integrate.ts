import * as fs from "fs";

import { getFontPlugin, HintOptions } from "./env";

export type IntegrateJob = [string, string, string];
export async function doIntegrate(
	options: HintOptions,
	glyphOnly: boolean,
	jobs: [string, string, string][]
) {
	const FontFormatPlugin = getFontPlugin(options);
	const integrator = FontFormatPlugin.createFinalHintIntegrator();

	for (const [instr, input, output] of jobs) {
		const instrStream = fs.createReadStream(instr);
		const inputStream = fs.createReadStream(input);
		const outStream = fs.createWriteStream(output);
		if (glyphOnly) {
			await integrator.integrateGlyphFinalHintsToFont(instrStream, inputStream, outStream);
		} else {
			await integrator.integrateFinalHintsToFont(instrStream, inputStream, outStream);
		}
	}
}
