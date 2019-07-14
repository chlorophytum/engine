import { EmptyImpl, HintMain } from "@chlorophytum/arch";
import * as Ideograph from "@chlorophytum/ideograph-shape-analyzer-1";
import * as fs from "fs";

import { Otd } from "./otd-font-format";

async function main() {
	const otdStream = fs.createReadStream(process.argv[2]);
	const fontSource = await Otd.createFontSource(otdStream);
	const hs = await HintMain.preHint(
		fontSource,
		[Ideograph.HintingModelPlugin, EmptyImpl.EmptyHintingModelFactory],
		[
			{ type: "Chlorophytum::EmptyHinting" },
			{
				type: "Chlorophytum::IdeographHintingModel1",
				parameters: JSON.parse(fs.readFileSync(process.argv[3], "utf-8"))
			}
		]
	);

	const out = fs.createWriteStream(process.argv[4]);
	await hs.save(out);
}

main().catch(e => console.error(e));
