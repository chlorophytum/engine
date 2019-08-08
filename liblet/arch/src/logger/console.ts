import { ILogger } from "../interfaces/index";

export class ConsoleLogger implements ILogger {
	public log(s: string) {
		console.log(s);
	}
}
