import { IFinalHintCollector, IFinalHintPreStatSink, IFontFormatPlugin } from "@chlorophytum/arch";
import { HlttCollector, HlttPreStatSink } from "@chlorophytum/final-hint-format-hltt";

import { TtfFinalHintSaver } from "./plugin-impl/final-hint-saver";
import { TtfFontLoader } from "./plugin-impl/font-loader";
import { TtfInstrIntegrator } from "./plugin-impl/instruction-integrator";
import { TtfPreStatAnalyzer } from "./plugin-impl/pre-stat";
import { HlttHintSessionConnection } from "./plugin-impl/session-connection";

export class TtfFontFormatPlugin implements IFontFormatPlugin {
	public async createFontLoader(path: string, identifier: string) {
		return new TtfFontLoader(path, identifier);
	}

	public async createPreStatAnalyzer(pss: IFinalHintPreStatSink) {
		const hlttPss = pss.dynamicCast(HlttPreStatSink);
		if (hlttPss) return new TtfPreStatAnalyzer(hlttPss);
		else return null;
	}

	public async createFinalHintSessionConnection(collector: IFinalHintCollector) {
		const hlttCollector = collector.dynamicCast(HlttCollector);
		if (hlttCollector) return new HlttHintSessionConnection(hlttCollector);
		else return null;
	}
	public async createFinalHintSaver(collector: IFinalHintCollector) {
		const hlttCollector = collector.dynamicCast(HlttCollector);
		if (hlttCollector) return new TtfFinalHintSaver(hlttCollector);
		else return null;
	}

	public async createFinalHintIntegrator() {
		return new TtfInstrIntegrator();
	}
}

export const FontFormatPlugin: IFontFormatPlugin = new TtfFontFormatPlugin();
