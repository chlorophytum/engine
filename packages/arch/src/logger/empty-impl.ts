import { ILogger } from "../interfaces/index";

export class EmptyLogger implements ILogger {
	public log(s: string) {}
	public indent() {
		return new EmptyLogger();
	}
	public bullet() {
		return new EmptyLogger();
	}
}
