import { IFinalHintSession, IHintStore } from "@chlorophytum/arch";

export async function mainMidHint(store: IHintStore, fhs: IFinalHintSession) {
	const glyphList = await store.listGlyphs();
	for (const gid of glyphList) {
		const ps = fhs.createGlyphProgramSink(gid);
		const hints = await store.getGlyphHints(gid);
		if (!hints) continue;
		const hc = hints.createCompiler(ps);
		if (!hc) continue;
		hc.doCompile();
		ps.save();
	}

	const sharedTypeList = await store.listSharedTypes();
	for (const modelType of sharedTypeList) {
		const ps = fhs.createSharedProgramSink(modelType);
		const hints = await store.getSharedHints(modelType);
		if (!hints) continue;
		const hc = hints.createCompiler(ps);
		if (!hc) continue;
		hc.doCompile();
		ps.save();
	}

	return fhs;
}
