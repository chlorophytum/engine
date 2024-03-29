import { IFinalHintSinkSession, IHintStore, PropertyBag } from "@chlorophytum/arch";

export async function mainMidHint(store: IHintStore, fhs: IFinalHintSinkSession) {
	const glyphList = await store.listGlyphs();
	for (const gid of glyphList) {
		const ck = await store.getGlyphHintsCacheKey(gid);
		const ps = await fhs.createGlyphProgramSink(gid, ck);
		const hints = await store.getGlyphHints(gid);
		if (!hints) continue;
		const hc = hints.createCompiler(new PropertyBag(), ps);
		if (!hc) continue;
		hc.doCompile();
		ps.save();
	}

	const sharedTypeList = await store.listSharedTypes();
	for (const modelType of sharedTypeList) {
		const ps = await fhs.createSharedProgramSink(modelType);
		const hints = await store.getSharedHints(modelType);
		if (!hints) continue;
		const hc = hints.createCompiler(new PropertyBag(), ps);
		if (!hc) continue;
		hc.doCompile();
		ps.save();
	}

	return fhs;
}
