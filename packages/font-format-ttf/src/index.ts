import {
	IFinalHintCollector,
	IFinalHintFormat,
	IFinalHintPreStatSink,
	IFontFormat,
	Plugins
} from "@chlorophytum/arch";
import {
	CHlttFinalHintFormat,
	HlttCollector,
	HlttPreStatSink
} from "@chlorophytum/final-hint-format-hltt";

import { TtfFontLoader } from "./plugin-impl/font-loader";
import { TtfInstrIntegrator } from "./plugin-impl/instruction-integrator";
import { TtfPreStatAnalyzer } from "./plugin-impl/pre-stat";
import { HlttHintSessionConnection } from "./plugin-impl/session-connection";

export class TtfFontFormat implements IFontFormat {
	public async loadFont(path: string, identifier: string) {
		return await new TtfFontLoader(path, identifier).load();
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
	public async createFinalHintIntegrator(fontPath: string) {
		return new TtfInstrIntegrator(fontPath);
	}
	public async getFinalHintFormat(): Promise<IFinalHintFormat> {
		return new CHlttFinalHintFormat();
	}
}

export const FontFormatPlugin: Plugins.IFontFormatPlugin = {
	load: async () => new TtfFontFormat()
};
