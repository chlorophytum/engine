import {
	Geometry,
	Glyph,
	HintingPass,
	IFontSource,
	IFontSourceMetadata,
	Variation
} from "@chlorophytum/arch";

import { GlyphHintJobs, GlyphHintRequests, GlyphHintSender } from "./common";
import { hintGlyphWorker } from "./glyph";

export async function getGlyphRep<GID>(
	font: IFontSource<GID>,
	gName: string
): Promise<null | Glyph.Rep> {
	const gid = await font.getGlyphFromName(gName);
	if (!gid) return null;
	const shapes: [(null | Variation.Master), Glyph.Shape][] = [];
	const masters: (null | Variation.MasterRep)[] = [null, ...(await font.getGlyphMasters(gid))];
	for (const m of masters) {
		const shape = await font.getGeometry(gid, m ? m.peak : null);
		shapes.push([m ? m.master : null, shape]);
	}
	return { shapes };
}

export async function createJobRequest<GID>(
	font: IFontSource<GID>,
	jobs: GlyphHintJobs
): Promise<GlyphHintRequests> {
	const req: GlyphHintRequests = {};
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

export async function parallelGlyphHintWork(
	fmd: IFontSourceMetadata,
	passes: HintingPass[],
	jobs: GlyphHintRequests,
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
