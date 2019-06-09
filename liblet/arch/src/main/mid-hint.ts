import { IFinalHintCollector, IFontSourceFactory } from "../interfaces";

export async function midHint(
	sf: IFontSourceFactory,
	ff: IFinalHintCollector,
	fromPath: string,
	toPath: string
) {
	const store = await sf.createHintStoreFromFile(fromPath);
	const fhs = ff.createSession();
	for (const gid of store.listGlyphs()) {
		const ps = fhs.createGlyphProgramSink(gid);
		const hints = store.getGlyphHints(gid);
		if (!hints) continue;
		const hc = hints.createCompiler(ps);
		if (!hc) continue;
		hc.doCompile();
		ps.save();
	}
	for (const modelType of store.listSharedTypes()) {
		const ps = fhs.createSharedProgramSink(modelType);
		const hints = store.getSharedHints(modelType);
		if (!hints) continue;
		const hc = hints.createCompiler(ps);
		if (!hc) continue;
		hc.doCompile();
		ps.save();
	}

	//await fhs.save(toPath);
}
