import { IFinalHintPreStatSink } from "@chlorophytum/arch";
import { implDynamicCast, Typable, TypeRep } from "typable";

export class TtFinalHintStore<F> {
	public glyphHints = new Map<string, F>();
	public fpgm?: F;
	public prep?: F;
}

export const HlttPreStatSink = new TypeRep<HlttPreStatSink>(
	"Chlorophytum::HlttFinalHintPlugin::HlttProgramSink"
);
export interface HlttPreStatSink extends IFinalHintPreStatSink {
	maxFunctionDefs: number;
	maxTwilightPoints: number;
	maxStorage: number;
	maxStack: number;
	cvtSize: number;
	varDimensionCount: number;
}
export function createPreStatSink(): HlttPreStatSink {
	return new HlttPreStatSinkImpl();
}

class HlttPreStatSinkImpl implements Typable<HlttPreStatSink> {
	public dynamicCast<U>(tr: TypeRep<U>): undefined | U {
		return implDynamicCast(tr, this, HlttPreStatSink);
	}
	public maxFunctionDefs = 0;
	public maxTwilightPoints = 0;
	public maxStorage = 0;
	public maxStack = 0;
	public cvtSize = 0;
	public varDimensionCount = 0;
	public settleDown() {}
}
