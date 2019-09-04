import { ILogger } from "@chlorophytum/arch";

function formatDuration(ms: number) {
	const sec_num = ms / 1000;
	const nHours = Math.floor(sec_num / 3600);
	const nMinutes = Math.floor((sec_num - nHours * 3600) / 60);
	const nSeconds = Math.round(sec_num - nHours * 3600 - nMinutes * 60);

	let hours = "" + nHours;
	let minutes = "" + nMinutes;
	let seconds = "" + nSeconds;
	if (hours.length === 1) hours = "0" + hours;
	if (minutes.length === 1) minutes = "0" + minutes;
	if (seconds.length === 1) seconds = "0" + seconds;
	return hours + ":" + minutes + ":" + seconds;
}

export class Progress {
	constructor(private prefix: string, private total: number) {}
	private lastProgress = 0;
	private hinted = 0;
	private startDate = new Date();
	private lastDate = new Date();

	public update(logger: ILogger, hide?: boolean) {
		let currentProgress = Math.floor(Math.min(100, (this.hinted / this.total) * 100));
		const now = new Date();
		if (this.shouldUpdateProgress(currentProgress, now)) {
			this.lastProgress = currentProgress;
			this.lastDate = now;
			const elapsedTime = now.valueOf() - this.startDate.valueOf();
			const remainingTime = elapsedTime * Math.max(0, this.total / this.hinted - 1);
			if (!hide) {
				logger.log(
					`${this.prefix} | ` +
						`${currentProgress}%  ` +
						`Elapsed ${formatDuration(elapsedTime)}  ` +
						`ETA ${formatDuration(remainingTime)}`
				);
			}
		}
		this.hinted += 1;
	}

	private shouldUpdateProgress(currentProgress: number, now: Date) {
		return (
			currentProgress !== this.lastProgress &&
			(currentProgress >= 100 || now.valueOf() - this.lastDate.valueOf() >= 5000)
		);
	}
}
