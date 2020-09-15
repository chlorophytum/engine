import { IFinalHintSession, IFinalHintSessionConnection } from "@chlorophytum/arch";
import { HlttCollector } from "@chlorophytum/final-hint-format-hltt";

export class HlttHintSessionConnection implements IFinalHintSessionConnection {
	constructor(private readonly collector: HlttCollector) {}
	public async connectFont(path: string): Promise<IFinalHintSession> {
		return this.collector.createSession();
	}
}
