import { IHintFactory } from "../interfaces";

export class FallbackHintFactory implements IHintFactory {
	constructor(private seq: IHintFactory[]) {}
	readJson(rep: any) {
		for (const hf of this.seq) {
			const answer = hf.readJson(rep, this);
			if (answer) return answer;
		}
		return null;
	}
}