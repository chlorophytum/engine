import {
	IFinalHintCollector,
	IFinalHintPreStatAnalyzer,
	IFinalHintPreStatSink,
	IFinalHintSessionConnection,
	IFontFinalHintIntegrator,
	IFontFinalHintSaver,
	IFontFormatPlugin,
	IFontLoader
} from "@chlorophytum/arch";
import { HlttCollector, HlttPreStatSink } from "@chlorophytum/final-hint-format-hltt";

import { TtfFinalHintSaver } from "./plugin-impl/final-hint-saver";
import { TtfFontLoader } from "./plugin-impl/font-loader";
import { TtfInstrIntegrator } from "./plugin-impl/instruction-integrator";
import { TtfPreStatAnalyzer } from "./plugin-impl/pre-stat";
import { HlttHintSessionConnection } from "./plugin-impl/session-connection";

export class TtfFontFormatPlugin implements IFontFormatPlugin {
	public createFontLoader(path: string, identifier: string): IFontLoader {
		return new TtfFontLoader(path, identifier);
	}

	public createPreStatAnalyzer(pss: IFinalHintPreStatSink): null | IFinalHintPreStatAnalyzer {
		const hlttPss = pss.dynamicCast(HlttPreStatSink);
		if (hlttPss) return new TtfPreStatAnalyzer(hlttPss);
		else return null;
	}

	public createFinalHintSessionConnection(
		collector: IFinalHintCollector
	): null | IFinalHintSessionConnection {
		const hlttCollector = collector.dynamicCast(HlttCollector);
		if (hlttCollector) return new HlttHintSessionConnection(hlttCollector);
		else return null;
	}
	public createFinalHintSaver(collector: IFinalHintCollector): null | IFontFinalHintSaver {
		const hlttCollector = collector.dynamicCast(HlttCollector);
		if (hlttCollector) return new TtfFinalHintSaver(hlttCollector);
		else return null;
	}

	public createFinalHintIntegrator(): IFontFinalHintIntegrator {
		return new TtfInstrIntegrator();
	}
}

export const FontFormatPlugin: IFontFormatPlugin = new TtfFontFormatPlugin();
