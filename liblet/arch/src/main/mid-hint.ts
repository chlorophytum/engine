import { IFinalHintCollector, IFontSourceFactory } from "../interfaces";

export async function midHint(
	sf: IFontSourceFactory,
	ff: IFinalHintCollector,
	fromPath: string,
	toPath: string
) {
	const store = await sf.createHintStoreFromFile(fromPath);
	const fhs = ff.createSession();
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

	//await fhs.save(toPath);
}
