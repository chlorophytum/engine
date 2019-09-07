import * as program from "commander";
import * as fs from "fs";
import * as _ from "lodash";

import { HintOptions } from "./env";
import { doHint } from "./hint";
import { doInstruct } from "./instruct";
import { doIntegrate, IntegrateJob } from "./integrate";

program.version("0.1.2-alpha");

program
	.command("hint <font> <toHint> [others...]")
	.option("-c, --config <json>", "Configuration file")
	.option("-j, --jobs <jobs>", "Jobs in parallel")
	.action(async (font, toHint, rest, options) => {
		if (!options.config) throw new TypeError("Configuration file is mandatory");
		const ho: HintOptions = JSON.parse(fs.readFileSync(options.config, "utf-8"));
		if (options.jobs) ho.jobs = options.jobs || 0;
		const jobFiles = [font, toHint, ...(rest || [])];
		await doHint(ho, _.chunk(jobFiles, 2) as [string, string][]);
	});

program
	.command("instruct <font> <hints> <instr> [others...]")
	.option("-c, --config <json>", "Configuration file")
	.action(async (font, hints, instr, rest, options) => {
		if (!options.config) throw new TypeError("Configuration file is mandatory");
		const ho = JSON.parse(fs.readFileSync(options.config, "utf-8"));
		const jobFiles = [font, hints, instr, ...(rest || [])];
		await doInstruct(ho, _.chunk(jobFiles, 3) as [string, string, string][]);
	});

program
	.command("integrate <instr> <input> <output> [others...]")
	.option("-c, --config <json>", "Configuration file")
	.option("-g, --glyph-only", "Glyph only mode")
	.action(async (instr, input, output, rest, options) => {
		if (!options.config) throw new TypeError("Configuration file is mandatory");
		const ho = JSON.parse(fs.readFileSync(options.config, "utf-8"));
		const jobFiles = [instr, input, output, ...(rest || [])];
		await doIntegrate(ho, !!options.glyphOnly, _.chunk(jobFiles, 3) as IntegrateJob[]);
	});

program.parse(process.argv);
