import { ILogger } from "@chlorophytum/arch";
import * as Procs from "@chlorophytum/procs";

export class HintArbitrator {
	private items: [string, string][] = [];
	private ptr: number = 0;
	constructor(
		jobs: Procs.GlyphHintJobs,
		private parallelJobs: number,
		prefix: string,
		private logger: ILogger
	) {
		for (const hmType in jobs) {
			const gsList = jobs[hmType];
			for (let gName of gsList) this.items.push([hmType, gName]);
		}
		this.progress = new Procs.Progress(prefix, this.items.length);
	}
	public fetch() {
		if (this.ptr >= this.items.length) return null;

		let workerJobs: Procs.GlyphHintJobs = {};
		const step = Math.max(
			this.parallelJobs,
			Math.min(
				0x100,
				Math.round(
					Math.max(1, this.items.length - this.ptr) / Math.max(1, this.parallelJobs)
				)
			)
		);

		for (let count = 0; count < step && this.ptr < this.items.length; count++, this.ptr++) {
			const [ty, gName] = this.items[this.ptr];
			if (!workerJobs[ty]) workerJobs[ty] = [];
			workerJobs[ty].push(gName);
		}
		return workerJobs;
	}

	private progress: Procs.Progress;

	public updateProgress() {
		this.progress.update(this.logger);
	}
}
