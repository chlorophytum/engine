import * as fs from "fs-extra";
import { FontIo, Ot } from "ot-builder";

import { OtbFontSource } from "../support/otb-support";

export class TtfFontLoader {
	constructor(private readonly path: string, private readonly identifier: string) {}
	public async load() {
		const sfnt = FontIo.readSfntOtf(await fs.readFile(this.path));
		const ttf = FontIo.readFont(sfnt, Ot.ListGlyphStoreFactory);
		return new OtbFontSource(ttf, this.identifier);
	}
}
