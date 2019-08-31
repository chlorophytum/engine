import {
	GlyphRep,
	GlyphShape,
	HintingPass,
	IFontSource,
	IFontSourceMetadata,
	MasterRep
} from "@chlorophytum/arch";

import { GlyphHintJobs, GlyphHintRequests, GlyphHintSender } from "./common";
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
): Promise<GlyphHintRequests<VAR, MASTER>> {
	const req: GlyphHintRequests<VAR, MASTER> = {};
	for (const type in jobs) {
		for (const job of jobs[type]) {
			const glyphRep = await getGlyphRep(font, job.glyphName);
			if (glyphRep) {
				if (!req[type]) req[type] = [];
				req[type].push({ ...job, glyphRep });
			}
		}
	}
	return req;
}

export async function parallelGlyphHintWork<GID, VAR, MASTER>(
	fmd: IFontSourceMetadata,
	passes: HintingPass[],
	jobs: GlyphHintRequests<VAR, MASTER>,
	sender: GlyphHintSender
) {
	for (const { uniqueID, plugin, parameters } of passes) {
		// Get the hinting model, skip if absent
		if (!plugin.adoptParallel) continue;

		const hm = plugin.adoptParallel(fmd, parameters);
		if (!hm) continue;

		for (const passID in jobs) {
			if (!passID || !jobs[passID] || passID !== uniqueID) continue;
			for (const req of jobs[passID]) {
				await hintGlyphWorker(passID, hm, sender, req);
			}
		}
	}
}
