import * as Path from "path";

import test from "ava";

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
	if (!a) {
		t.fail("Glyph a not exist. Return");
		return;
	}
	t.deepEqual(await font.getGlyphMasters(a), [
		{ peak: { "wght#0": -1 }, master: { otVar: { "wght#0": { min: -1, peak: -1, max: 0 } } } },
		{ peak: { "wght#0": 1 }, master: { otVar: { "wght#0": { min: 0, peak: 1, max: 1 } } } }
	]);
});

test("Instance conversion", async t => {
	const font = await loadFont("AdobeVFPrototype.ttf");
	const entry = (await font.getEntries())[0];
	const a = await entry.getEncodedGlyph(0x61);
	if (!a) {
		t.fail("Glyph a not exist. Return");
		return;
	}

	async function testValMap(a: number, b: number) {
		const ax = await font.convertUserInstanceToNormalized({ user: { "wght#0": a } });
		t.deepEqual(b, ax!["wght#0"]);
	}

	await testValMap(100, -1);
	await testValMap(200, -1);
	await testValMap(300, -7731 / 16384);
	await testValMap(350, -4274 / 16384);
	await testValMap(400, 342 / 16384);
	await testValMap(900, +1);
});
