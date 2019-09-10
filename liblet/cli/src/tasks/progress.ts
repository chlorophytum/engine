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
	constructor(private prefix: string, private readonly logger: ILogger) {}
	private totalTasks = 0;
	private finishedTasks = 0;
	private totalDifficulty = 0;
	private finishedDifficulty = 0;

	private lastProgress = 0;
	private startDate = new Date();
	private lastDate = new Date();

	private percentage(a: number, b: number) {
		if (!b) return 0;
		return Math.floor(Math.min(100, (a / b) * 100));
	}
	private coRate(a: number, b: number) {
		if (!b) return 0xffff;
		return a / b;
	}

	public start(difficulty: number) {
		this.totalTasks += 1;
		this.totalDifficulty += difficulty;
		this.update();
	}
	public end(difficulty: number) {
		this.finishedTasks += 1;
		this.finishedDifficulty += difficulty;
		this.update();
	}

	public update() {
		let currentProgress = this.percentage(this.finishedDifficulty, this.totalDifficulty);
		const now = new Date();
		if (this.shouldUpdateProgress(currentProgress, now)) {
			this.lastProgress = currentProgress;
			this.lastDate = now;
			const elapsedTime = now.valueOf() - this.startDate.valueOf();
			const remainingTime =
				elapsedTime *
				Math.max(0, this.coRate(this.totalDifficulty, this.finishedDifficulty) - 1);
			this.logger.log(
				`${this.prefix} | ` +
					`${currentProgress}%  ` +
					`Finished ${this.finishedTasks} Total ${this.totalTasks} ` +
					`Elapsed ${formatDuration(elapsedTime)}  ` +
					`ETA ${formatDuration(remainingTime)}`
			);
		}
	}

	private shouldUpdateProgress(currentProgress: number, now: Date) {
		return (
			currentProgress !== this.lastProgress &&
			(currentProgress >= 100 || now.valueOf() - this.lastDate.valueOf() >= 5000)
		);
	}
}
