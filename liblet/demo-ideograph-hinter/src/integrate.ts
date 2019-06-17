import * as fs from "fs";

import { Otd } from "./otd-font-format";

async function main() {
	const instrStream = fs.createReadStream(process.argv[2]);
	const otdStream = fs.createReadStream(process.argv[3]);
	const out = fs.createWriteStream(process.argv[4]);
	await Otd.integrateFinalHintsToFont(instrStream, otdStream, out);
}

main().catch(e => console.error(e));
