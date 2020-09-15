import { ILogger } from "../interfaces/index";

export class ConsoleLogger implements ILogger {
	constructor(private readonly indentPrefix = "", private readonly bulletPrefix = "") {}
	public indent(indent: string) {
		return new ConsoleLogger(this.indentPrefix + indent, this.bulletPrefix);
	}
	public bullet(bullet: string) {
		return new ConsoleLogger(this.indentPrefix, bullet);
	}
	public log(s: string) {
		console.log(this.indentPrefix + this.bulletPrefix + s);
	}
}
