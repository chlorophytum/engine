export class TtFinalHintStore<F> {
	public glyphHints = new Map<string, F>();
	public fpgm?: F;
	public prep?: F;
}

export class HlttPreStatSink {
	public maxFunctionDefs = 0;
	public maxTwilightPoints = 0;
	public maxStorage = 0;
	public maxStack = 0;
	public cvtSize = 0;
	public varDimensionCount = 0;
	public settleDown() {}
}
