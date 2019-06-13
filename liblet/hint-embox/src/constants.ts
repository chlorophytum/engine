import { ProgramDsl } from "@chlorophytum/hltt";

export const PREFIX = "Chlorophytum::EmBox::Shared::TwilightPoint::";

export function TranslateEmboxTwilightName(boxName: string, pointName: string) {
	return `${PREFIX}::${boxName}::${pointName}`;
}

export function getEmBoxPoints($: ProgramDsl, boxName: string) {
	const strokeBottom = $.globalTwilight(TranslateEmboxTwilightName(boxName, `StrokeBottom`));
	const strokeTop = $.globalTwilight(TranslateEmboxTwilightName(boxName, `StrokeTop`));
	const archBottom = $.globalTwilight(TranslateEmboxTwilightName(boxName, `ArchBottom`));
	const archTop = $.globalTwilight(TranslateEmboxTwilightName(boxName, `ArchTop`));
	const spurBottom = $.globalTwilight(TranslateEmboxTwilightName(boxName, `SpurBottom`));
	const spurTop = $.globalTwilight(TranslateEmboxTwilightName(boxName, `SpurTop`));
	return { strokeBottom, strokeTop, archBottom, archTop, spurBottom, spurTop };
}
