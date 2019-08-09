import {
	HintingModelConfig,
	IFontSource,
	IHintingModel,
	IHintingModelPlugin,
	IHintStore,
	ILogger
} from "../interfaces";
import { Progress } from "../support/progress";

function findMatchingFactory(type: string, modelFactories: IHintingModelPlugin[]) {
	for (const mf of modelFactories) if (mf.type === type) return mf;
	return null;
}

export interface MainHintJobControl {
	generateJob?: number;
	executeJob?: number;
	progressMultiplier?: number;
	jobs?: { [type: string]: string[] };
}

class JobMaker<GID> {
	constructor(
		private readonly type: string,
		private readonly jc: MainHintJobControl,
		private readonly hm: IHintingModel<GID>,
		private rj: MainHintJobControl
	) {}
	public process(gName: string) {
		if (this.jc.generateJob && this.hm.allowParallel) {
			if (!this.rj.jobs![this.type]) this.rj.jobs![this.type] = [];
			this.rj.jobs![this.type].push(gName);
			return true;
		}
		return false;
	}
}

class JobFilter<GID> {
	constructor(
		private readonly type: string,
		private readonly jc: MainHintJobControl,
		private readonly hm: IHintingModel<GID>
	) {
		this.gnSet = jc.jobs && hm.allowParallel ? new Set(jc.jobs[type] || []) : new Set();
	}
	private gnSet: Set<string>;

	public shouldSkip(gName: string) {
		return this.jc.jobs && (!this.hm.allowParallel || !this.gnSet.has(gName));
	}
}

async function hintGlyph<GID, VAR, MASTER>(
	font: IFontSource<GID, VAR, MASTER>,
	hm: IHintingModel<GID>,
	hs: IHintStore,
	maker: JobMaker<GID>,
	filter: JobFilter<GID>,
	glyph: GID
) {
	const gName = await font.getUniqueGlyphName(glyph);
	if (!gName) return false;
	if (maker.process(gName)) return false;
	if (filter.shouldSkip(gName)) return false;

	const hints = await hm.analyzeGlyph(glyph);
	if (hints) await hs.setGlyphHints(gName, hints);
	return true;
}

export default async function mainPreHint<GID, VAR, MASTER>(
	font: IFontSource<GID, VAR, MASTER>,
	modelFactories: IHintingModelPlugin[],
	modelConfig: HintingModelConfig[],
	jobControl: MainHintJobControl,
	logger: ILogger
) {
	const hs = font.createHintStore();
	const rj: MainHintJobControl = { generateJob: 0, jobs: {} };

	for (const { type, parameters } of modelConfig) {
		// Get the hinting model, skip if absent
		const mf = findMatchingFactory(type, modelFactories);
		if (!mf) continue;
		const hm = mf.adopt(font, parameters);
		if (!hm) continue;

		// Skip this model if we are in parallel mode and it is serial-only
		if (jobControl.jobs && !hm.allowParallel) continue;

		// Analyze shared parameters, get the glyph list to be processed
		const glyphs = await hm.analyzeSharedParameters();
		if (!glyphs) continue;

		// Create a progress bar
		const progress = new Progress(
			(jobControl.progressMultiplier
				? `[${jobControl.executeJob}/${jobControl.progressMultiplier}] `
				: "") + `${font.metadata.identifier} | ${type}`,
			glyphs.size
		);

		// Create job maker and filter
		const maker = new JobMaker(type, jobControl, hm, rj);
		const filter = new JobFilter(type, jobControl, hm);

		// Hint the glyphs
		for (const glyph of glyphs) {
			const hinted = await hintGlyph(font, hm, hs, maker, filter, glyph);
			progress.update(logger, !hinted);
		}
		progress.update(logger);

		// Hint the shared parts
		const sharedHints = await hm.getSharedHints();
		if (sharedHints) await hs.setSharedHints(hm.type, sharedHints);
	}
	return { hints: hs, remainingJobs: rj };
}
