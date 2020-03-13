import { IFontLoader } from "@chlorophytum/arch";
import * as fs from "fs-extra";
import { FontIo, Ot } from "ot-builder";

import { OtbFontSource } from "../support/otb-support";

export class TtfFontLoader implements IFontLoader {
	constructor(private readonly path: string, private readonly identifier: string) {}
	public async load() {
		const otd = await this.readFont(this.path);
		return new OtbFontSource(otd, this.identifier);
	}
	private async readFont(sFont: string) {
		const sfnt = FontIo.readSfntOtf(await fs.readFile(sFont));
		return FontIo.readFont(sfnt, Ot.ListGlyphStoreFactory);
	}
}
