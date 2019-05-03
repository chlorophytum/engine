import {
	IFinalHintFormat,
	IFinalHintSink,
	IFontConnection,
	IFontFormat,
	Plugins
} from "@chlorophytum/arch";
import {
	CHlttFinalHintFormat,
	HlttCollector,
	HlttFinalHintFormatOptions
} from "@chlorophytum/final-hint-format-hltt";

import { TtfFontLoader } from "./plugin-impl/font-loader";
import { TtfInstrIntegrator } from "./plugin-impl/instruction-integrator";
import { TtfPreStatAnalyzer } from "./plugin-impl/pre-stat";

class TtfFontFormat implements IFontFormat {
	constructor(private readonly options: HlttFinalHintFormatOptions) {}
	public async getFinalHintFormat(): Promise<IFinalHintFormat> {
		return new CHlttFinalHintFormat(this.options);
	}
	public async connectFont(path: string, identifier: string) {
		return new TtfFontConnection(path, identifier);
	}
}

class TtfFontConnection implements IFontConnection {
	constructor(
		private readonly path: string,
		private readonly identifier: string
	) {}

	public async openFontSource() {
		return await new TtfFontLoader(this.path, this.identifier).load();
	}

	public async openPreStat(sink: IFinalHintSink) {
		const hlttSink = sink.dynamicCast(HlttCollector);
		if (hlttSink) return new TtfPreStatAnalyzer(this.path, hlttSink);
		else return null;
	}

	public async openFinalHintIntegrator() {
		return new TtfInstrIntegrator(this.path);
	}
}

export const FontFormatPlugin: Plugins.IFontFormatPlugin = {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	load: async (loader: Plugins.IAsyncModuleLoader, parameters: any) =>
		new TtfFontFormat(CHlttFinalHintFormat.rectifyOptions(parameters))
};

export { GlyphSetWrapper } from "./support/otb-support";
