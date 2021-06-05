/* eslint-disable @typescript-eslint/no-explicit-any */
import { IFontSource, IHintFactory, IHintingPass, Plugins } from "@chlorophytum/arch";

import { GlyphSelector, ProxyFontSource } from "./proxy-font-entry";
import { UnicodeSubRange } from "./unicode-sub-range";

export interface SubpassOption {
	readonly hintPlugin: string;
	readonly hintOptions: any;
}
export interface SelectGlyphOptions {
	readonly unicodeRange: UnicodeSubRange;
	readonly trackScripts?: null | undefined | ReadonlyArray<string>;
	readonly trackFeatures?: null | undefined | ReadonlyArray<string>;
	readonly pass: SubpassOption;
}

export class CHmSelectGlyphsPlugin implements Plugins.IHintingModelPlugin {
	public async load(loader: Plugins.IAsyncModuleLoader, _parameters: any) {
		if (!_parameters.pass || !_parameters.unicodeRange) {
			throw new Error("Must specify pass and unicode range.");
		}
		const parameters: SelectGlyphOptions = _parameters;

		const selector: GlyphSelector = {
			unicodeRange: parameters.unicodeRange,
			trackScripts: parameters.trackScripts || [],
			trackFeatures: parameters.trackFeatures || []
		};

		const plugin = await loader.import<Plugins.HintingModelModule>(parameters.pass.hintPlugin);
		const subpass = await plugin.HintingModelPlugin.load(loader, parameters.pass.hintOptions);

		return new CHmSelectGlyphs(subpass, selector);
	}
}

export class CHmSelectGlyphs implements IHintingPass {
	constructor(private readonly subpass: IHintingPass, private readonly selector: GlyphSelector) {
		this.requirePreHintRounds = subpass.requirePreHintRounds;
		this.factoriesOfUsedHints = subpass.factoriesOfUsedHints;
	}
	public adopt<GID>(font: IFontSource<GID>) {
		return this.subpass.adopt(new ProxyFontSource(font, this.selector));
	}
	public createParallelTask<RepArg>(type: string, args: RepArg) {
		return this.subpass.createParallelTask(type, args);
	}

	public readonly requirePreHintRounds: number;
	public readonly factoriesOfUsedHints: ReadonlyArray<IHintFactory>;
}

export const HintingModelPlugin = new CHmSelectGlyphsPlugin();
