#!/usr/bin/env node

import * as program from "commander";
import * as fs from "fs";
import * as json5 from "json5";
import * as _ from "lodash";
import * as path from "path";

import { HintOptions } from "./env";
import { doHint, HintRestOptions } from "./hint";
import { doInstruct } from "./instruct";
import { doIntegrate, IntegrateJob } from "./integrate";

const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, "../package.json"), "utf8"));

program.version(packageJson.version);

function readHintOptions(from: null | undefined | string) {
	if (!from) throw new TypeError("Configuration file is mandatory");
	const ho: HintOptions = json5.parse(fs.readFileSync(from, "utf-8"));
	return ho;
}

program
	.command("hint <font> <toHint> [others...]")
	.option("-c, --config <json>", "Configuration file")
	.option("-h, --cache <cache.gz>", "Hint cache file")
	.option("-j, --jobs <jobs>", "Jobs in parallel")
	.action(
		WithErrors(async (font, toHint, rest, options) => {
			const ho = readHintOptions(options.config);
			if (options.jobs) ho.jobs = options.jobs || 0;
			const jobFiles = [font, toHint, ...(rest || [])];
			const hro: HintRestOptions = {
				cacheFilePath: options.cache
			};
			await doHint(ho, hro, _.chunk(jobFiles, 2) as [string, string][]);
		})
	);

program
	.command("instruct <font> <hints> <instr> [others...]")
	.option("-c, --config <json>", "Configuration file")
	.action(
		WithErrors(async (font, hints, instr, rest, options) => {
			const ho = readHintOptions(options.config);
			const jobFiles = [font, hints, instr, ...(rest || [])];
			await doInstruct(ho, _.chunk(jobFiles, 3) as [string, string, string][]);
		})
	);

program
	.command("integrate <instr> <input> <output> [others...]")
	.option("-c, --config <json>", "Configuration file")
	.option("-g, --glyph-only", "Glyph only mode")
	.action(
		WithErrors(async (instr, input, output, rest, options) => {
			const ho = readHintOptions(options.config);
			const jobFiles = [instr, input, output, ...(rest || [])];
			await doIntegrate(ho, !!options.glyphOnly, _.chunk(jobFiles, 3) as IntegrateJob[]);
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
