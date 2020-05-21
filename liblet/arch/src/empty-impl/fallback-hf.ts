import { IHintFactory } from "../interfaces";

export class FallbackHintFactory implements IHintFactory {
	constructor(private seq: readonly IHintFactory[]) {}
	public readonly type = "Chlorophytum::FallbackHintFactory";
	public readJson(rep: any, general: IHintFactory) {
		for (const hf of this.seq) {
			const answer = hf.readJson(rep, general);
			if (answer) return answer;
		}
		return null;
	}
}
