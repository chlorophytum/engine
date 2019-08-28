import { HintingModelConfig, IFontSource, IHintingModelPlugin, ILogger } from "@chlorophytum/arch";

import { Progress } from "../support/progress";

import { findMatchingFactory, GlyphHintJobs, GlyphHintSender } from "./common";
import { hintGlyphWorker, JobFilter } from "./glyph";

export async function parallelGlyphHintWork<GID, VAR, MASTER>(
	font: IFontSource<GID, VAR, MASTER>,
	modelFactories: IHintingModelPlugin[],
	modelConfig: HintingModelConfig[],
	jobs: GlyphHintJobs,
	sender: GlyphHintSender,
	logger: ILogger
) {
	const jf = new JobFilter(jobs);

	for (const { type, parameters } of modelConfig) {
		// Get the hinting model, skip if absent
		const mf = findMatchingFactory(type, modelFactories);
		if (!mf) continue;
		const hm = mf.adopt(font, parameters);
		if (!hm) continue;
		if (!hm.allowParallel) continue;

		const glyphs = await hm.analyzeEffectiveGlyphs();
		if (!glyphs) continue;

		const progress = new Progress(`${font.metadata.identifier} | ${type}`, glyphs.size);

		for (const glyph of glyphs) {
			const hinted = await hintGlyphWorker(font, hm, sender, jf, glyph);
			progress.update(logger, !hinted);
		}
		progress.update(logger);
	}
}
