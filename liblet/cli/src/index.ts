#!/usr/bin/env node

import * as CliProc from "@chlorophytum/cli-proc";
import * as program from "commander";
import * as fs from "fs";
import * as json5 from "json5";
import * as _ from "lodash";
import * as path from "path";

const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, "../package.json"), "utf8"));

program.version(packageJson.version);

function readProcOptions(from: null | undefined | string) {
	if (!from) throw new TypeError("Configuration file is mandatory");
	const ho: CliProc.ProcOptions = json5.parse(fs.readFileSync(from, "utf-8"));
	return ho;
}

program
	.command("hint <font> <toHint> [others...]")
	.option("-c, --config <json>", "Configuration file")
	.option("-h, --cache <cache.gz>", "Hint cache file")
	.option("-j, --jobs <jobs>", "Jobs in parallel")
	.action(
		WithErrors(async (font, toHint, rest, options) => {
			const ho = readProcOptions(options.config);
			if (options.jobs) ho.jobs = options.jobs || 0;
			const jobFiles = [font, toHint, ...(rest || [])];
			await CliProc.doHint(
				{ ...ho, cacheFilePath: options.cache },
				_.chunk(jobFiles, 2) as CliProc.HintJob[]
			);
		})
	);

program
	.command("instruct <font> <hints> <instr> [others...]")
	.option("-c, --config <json>", "Configuration file")
	.action(
		WithErrors(async (font, hints, instr, rest, options) => {
			const ho = readProcOptions(options.config);
			const jobFiles = [font, hints, instr, ...(rest || [])];
			await CliProc.doInstruct(ho, _.chunk(jobFiles, 3) as CliProc.InstructJob[]);
		})
	);

program
	.command("integrate <instr> <input> <output> [others...]")
	.option("-c, --config <json>", "Configuration file")
	.option("-g, --glyph-only", "Glyph only mode")
	.action(
		WithErrors(async (instr, input, output, rest, options) => {
			const ho = readProcOptions(options.config);
			const jobFiles = [instr, input, output, ...(rest || [])];
			await CliProc.doIntegrate(
				{ ...ho, glyphOnly: !!options.glyphOnly },
				_.chunk(jobFiles, 3) as CliProc.IntegrateJob[]
			);
		})
	);

program.parse(process.argv);

///////////////////////////////////////////////////////////////////////////////////////////////////
function WithErrors<A extends any[]>(command: (...args: A) => Promise<void>) {
	return async (...args: A) => {
		try {
			await command(...args);
		} catch (e) {
			console.error(e);
			process.exitCode = 1;
		}
	};
}
