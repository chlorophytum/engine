import {
	GlyphRep,
	GlyphShape,
	HintingModelConfig,
	IFontSource,
	IFontSourceMetadata,
	IHintingModelPlugin,
	MasterRep
} from "@chlorophytum/arch";

import { findMatchingFactory, GlyphHintJobs, GlyphHintRequest, GlyphHintSender } from "./common";
import { hintGlyphWorker } from "./glyph";

export async function getGlyphRep<GID, VAR, MASTER>(
	font: IFontSource<GID, VAR, MASTER>,
	gName: string
): Promise<null | GlyphRep<VAR, MASTER>> {
	const gid = await font.getGlyphFromName(gName);
	if (!gid) return null;
	const shapes: [(null | MasterRep<VAR, MASTER>), GlyphShape][] = [];
	const masters: (null | MasterRep<VAR, MASTER>)[] = [null, ...(await font.getGlyphMasters(gid))];
	for (const m of masters) {
		const shape = await font.getGeometry(gid, m ? m.peak : null);
		shapes.push([m, shape]);
	}
	return { shapes };
}

export async function createJobRequest<GID, VAR, MASTER>(
	font: IFontSource<GID, VAR, MASTER>,
	jobs: GlyphHintJobs
): Promise<GlyphHintRequest<VAR, MASTER>> {
	const req: GlyphHintRequest<VAR, MASTER> = {};
	for (const type in jobs) {
		for (const gName of jobs[type]) {
			const glyphRep = await getGlyphRep(font, gName);
			if (glyphRep) {
				if (!req[type]) req[type] = [];
				req[type].push([gName, glyphRep]);
			}
		}
	}
	return req;
}

export async function parallelGlyphHintWork<GID, VAR, MASTER>(
	fmd: IFontSourceMetadata,
	modelFactories: IHintingModelPlugin[],
	modelConfig: HintingModelConfig[],
	jobs: GlyphHintRequest<VAR, MASTER>,
	sender: GlyphHintSender
) {
	for (const { type, parameters } of modelConfig) {
		// Get the hinting model, skip if absent
		const mf = findMatchingFactory(type, modelFactories);
		if (!mf || !mf.adoptParallel) continue;

		const hm = mf.adoptParallel(fmd, parameters);
		if (!hm) continue;

		for (const type in jobs) {
			if (!type || !jobs[type]) continue;
			for (const [gName, gRep] of jobs[type]) {
				await hintGlyphWorker(hm, sender, gName, gRep);
			}
		}
	}
}
