import { ILogger } from "../interfaces/index";

export class EmptyLogger implements ILogger {
	public log(s: string) {}
}
