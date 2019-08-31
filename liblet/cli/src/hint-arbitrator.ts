import { IFontSource, ILogger } from "@chlorophytum/arch";
import * as Procs from "@chlorophytum/procs";
import { GlyphHintJob } from "@chlorophytum/procs";

import { JobMessage } from "./hint-shared";

export class HintArbitrator<GID, VAR, MASTER> {
	private items: [string, GlyphHintJob][] = [];
	private ptr: number = 0;
	constructor(
		private readonly font: IFontSource<GID, VAR, MASTER>,
		jobs: Procs.GlyphHintJobs,
		private parallelJobs: number,
		prefix: string,
		private logger: ILogger
	) {
		for (const hmType in jobs) {
			const jobList = jobs[hmType];
			for (let job of jobList) this.items.push([hmType, job]);
		}
		this.progress = new Procs.Progress(prefix, this.items.length);
	}
	public async fetch(): Promise<null | JobMessage<VAR, MASTER>> {
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

		return {
			fontMetadata: this.font.metadata,
			jobRequests: await Procs.createJobRequest(this.font, workerJobs)
		};
	}

	private progress: Procs.Progress;

	public updateProgress() {
		this.progress.update(this.logger);
	}
}
