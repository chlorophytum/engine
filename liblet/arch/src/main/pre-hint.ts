import { HintingModelConfig, IFontSource, IHintingModelPlugin, ILogger } from "../interfaces";

function formatDuration(ms: number) {
	const sec_num = ms / 1000;
	const nHours = Math.floor(sec_num / 3600);
	const nMinutes = Math.floor((sec_num - nHours * 3600) / 60);
	const nSeconds = Math.round(sec_num - nHours * 3600 - nMinutes * 60);

	let hours = "" + nHours;
	let minutes = "" + nMinutes;
	let seconds = "" + nSeconds;
	if (hours.length === 1) hours = "0" + hours;
	if (minutes.length === 1) minutes = "0" + minutes;
	if (seconds.length === 1) seconds = "0" + seconds;
	return hours + ":" + minutes + ":" + seconds;
}

function findMatchingFactory(type: string, modelFactories: IHintingModelPlugin[]) {
	for (const mf of modelFactories) if (mf.type === type) return mf;
	return null;
}

export default async function mainPreHint<GID, VAR, MASTER>(
	font: IFontSource<GID, VAR, MASTER>,
	modelFactories: IHintingModelPlugin[],
	modelConfig: HintingModelConfig[],
	logger: ILogger
) {
	const hs = font.createHintStore();
	for (const { type, parameters } of modelConfig) {
		const mf = findMatchingFactory(type, modelFactories);
		if (!mf) continue;
		const hm = mf.adopt(font, parameters);
		if (!hm) continue;
		const glyphs = await hm.analyzeSharedParameters();
		if (!glyphs) continue;

		let startTime = new Date();
		let progress = 0;
		let glyphCount = glyphs.size;
		let hintedCount = 0;
		for (const glyph of glyphs) {
			const gName = await font.getUniqueGlyphName(glyph);
			if (!gName) continue;
			const hints = await hm.analyzeGlyph(glyph);
			if (hints) await hs.setGlyphHints(gName, hints);
			hintedCount += 1;

			let currentProgress = Math.floor((hintedCount / glyphCount) * 100);
			if (currentProgress !== progress) {
				progress = currentProgress;
				const now = new Date();
				const elapsedTime = now.valueOf() - startTime.valueOf();
				const remainingTime = elapsedTime * Math.max(0, glyphCount / hintedCount - 1);
				logger.log(
					`${font.metadata.identifier} | ${type} | ` +
						`${currentProgress}%  ` +
						`Elapsed ${formatDuration(elapsedTime)}  ` +
						`ETA ${formatDuration(remainingTime)}`
				);
			}
		}
		const sharedHints = await hm.getSharedHints();
		if (sharedHints) await hs.setSharedHints(hm.type, sharedHints);
	}
	return hs;
}
