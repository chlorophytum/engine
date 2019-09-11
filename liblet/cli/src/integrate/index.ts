import { ConsoleLogger } from "@chlorophytum/arch";
import * as fs from "fs";

import { getFontPlugin, HintOptions } from "../env";

export type IntegrateJob = [string, string, string];
export async function doIntegrate(
	options: HintOptions,
	glyphOnly: boolean,
	jobs: [string, string, string][]
) {
	const FontFormatPlugin = getFontPlugin(options);
	const integrator = FontFormatPlugin.createFinalHintIntegrator();

	const logger = new ConsoleLogger();
	logger.log("Instruction integration");

	{
		const briefLogger = logger.bullet(" * ");
		for (const [font, input, output] of jobs) {
			briefLogger.log(`Job: ${font} | ${input} -> ${output}`);
		}
	}
	{
		const jobLogger = logger.bullet(" + ");
		for (const [instr, input, output] of jobs) {
			jobLogger.log(`Integrating ${instr} | ${input} -> ${output}`);

			if (glyphOnly) {
				await integrator.integrateGlyphFinalHintsToFont(instr, input, output);
			} else {
				await integrator.integrateFinalHintsToFont(instr, input, output);
			}
		}
	}
}
