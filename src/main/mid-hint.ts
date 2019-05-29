import { IFinalHintFactory, IFontSourceFactory } from "../interfaces";

export async function midHint(
	sf: IFontSourceFactory,
	ff: IFinalHintFactory,
	fromPath: string,
	toPath: string
) {
	const store = await sf.createHintStoreFromFile(fromPath);
	const fhs = ff.createFinalHintSinkFor(store);
	for (const gid of store.listGlyphs()) {
		const hints = store.getGlyphHints(gid);
		if (!hints) continue;
		const hc = hints.createCompiler(fhs);
		if (!hc) continue;
		hc.doCompile();
	}
	for (const modelType of store.listSharedTypes()) {
		const hints = store.getSharedHints(modelType);
		if (!hints) continue;
		const hc = hints.createCompiler(fhs);
		if (!hc) continue;
		hc.doCompile();
	}

	await fhs.save(toPath);
}
