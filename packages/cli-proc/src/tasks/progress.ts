import { ILogger } from "@chlorophytum/arch";

function formatDuration(ms: number) {
	if (!isFinite(ms)) return `--:--:--`;

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

const SMOOTHING = 1 / 32;
export class Progress {
	constructor(
		private prefix: string,
		private readonly logger: ILogger
	) {}
	private totalTasks = 0;
	private finishedTasks = 0;
	private totalDifficulty = 0;
	private finishedDifficulty = 0;

	private rate = 0;
	private rateVar = 0;
	private lastDifficulty = 0;
	private startDate = new Date();
	private lastDate = new Date();

	private lastDisplayProgress = 0;
	private lastDisplayDate = new Date();

	private percentage(a: number, b: number) {
		if (!b) return 0;
		return Math.floor(Math.min(100, (a / b) * 100));
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
		const currentProgress = this.percentage(this.finishedDifficulty, this.totalDifficulty);
		const now = new Date();
		const deltaTime = now.valueOf() - this.lastDate.valueOf();
		if (deltaTime >= 250) {
			const currentRate = (this.finishedDifficulty - this.lastDifficulty) / deltaTime;
			const delta = currentRate - this.rate;
			this.rate += SMOOTHING * delta;
			this.rateVar = (1 - SMOOTHING) * (this.rateVar + SMOOTHING * delta * delta);
			if (delta * delta > 9 * this.rateVar) this.rate = currentRate;
			this.lastDifficulty = this.finishedDifficulty;
			this.lastDate = now;
		}

		if (this.shouldDisplayProgress(currentProgress, now)) {
			const elapsedTime = now.valueOf() - this.startDate.valueOf();
			const remainingTime = (this.totalDifficulty - this.finishedDifficulty) / this.rate;
			this.logger.log(
				`${this.prefix} | ` +
					`${currentProgress}%  ` +
					`Finished ${this.finishedTasks} Total ${this.totalTasks} ` +
					`Elapsed ${formatDuration(elapsedTime)} ` +
					`ETC ${formatDuration(remainingTime)}`
			);
			this.lastDisplayDate = now;
			this.lastDisplayProgress = currentProgress;
		}
	}

	private shouldDisplayProgress(currentProgress: number, now: Date) {
		return (
			currentProgress !== this.lastDisplayProgress &&
			(currentProgress >= 100 || now.valueOf() - this.lastDisplayDate.valueOf() >= 5000)
		);
	}
}
