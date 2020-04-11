import test from "ava";
import * as Path from "path";

import { TtfFontLoader } from "../plugin-impl/font-loader";

const testFontDir = Path.join(__dirname, "../../test-fonts");

function loadFont(name: string) {
	const loader = new TtfFontLoader(Path.join(testFontDir, name), "test-font");
	return loader.load();
}

test("Variation dim tests", async t => {
	const font = await loadFont("SourceSerifVariable-Roman.ttf");
	t.deepEqual(await font.getVariationDimensions(), ["wght#0"]);
});

test("Master collection tests", async t => {
	const font = await loadFont("SourceSerifVariable-Roman.ttf");
	const entry = (await font.getEntries())[0];
	const a = await entry.getEncodedGlyph(0x61);
	if (!a) return t.fail("Glyph a not exist. Return");
	t.deepEqual(await font.getGlyphMasters(a), [
		{ peak: { "wght#0": -1 }, master: { "wght#0": { min: -1, peak: -1, max: 0 } } },
		{ peak: { "wght#0": 1 }, master: { "wght#0": { min: 0, peak: 1, max: 1 } } }
	]);
});
