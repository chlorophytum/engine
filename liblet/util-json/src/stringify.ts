import * as stream from "stream";

const BUFFER_LIMIT = 1e6;
const NEST = 3;

class JsonStringifyContext {
	constructor(private readonly writer: stream.Writable) {}
	private buffer = "";

	private push(str: string) {
		this.buffer += str;
		if (this.buffer.length > BUFFER_LIMIT) this.flush();
	}
	public flush() {
		if (!this.buffer) return;
		this.writer.write(this.buffer, "utf8");
		this.buffer = "";
	}
	private traverseSync(obj: any, level: number) {
		this.push(JSON.stringify(obj));
	}

	public async traverse(obj: any, level: number) {
		switch (typeof obj) {
			case "string":
			case "number":
			case "boolean":
				this.push(JSON.stringify(obj));
				return;

			default: {
				if (!obj) {
					this.push("null");
				} else if (obj instanceof Array) {
					let needComma = false;
					this.push("[");
					for (let j = 0; j < obj.length; j++) {
						if (needComma) this.push(",");
						if (level < NEST) {
							await this.traverse(obj[j], level + 1);
						} else {
							this.traverseSync(obj[j], level + 1);
						}
						needComma = true;
					}
					this.push("]");
				} else {
					let keys = Object.keys(obj);
					let needComma = false;
					this.push("{");
					for (let key of keys) {
						if (needComma) this.push(",");
						this.push(JSON.stringify(key));
						this.push(":");
						if (level < NEST) {
							await this.traverse(obj[key], level + 1);
						} else {
							this.traverseSync(obj[key], level + 1);
						}
						needComma = true;
					}
					this.push("}\n");
				}
			}
		}
	}
}

export function jsonStringifyToStream(obj: object, writer: stream.Writable, dontEnd?: boolean) {
	const ctx = new JsonStringifyContext(writer);

	return ctx.traverse(obj, 0).then(
		() =>
			new Promise<void>((resolve, reject) => {
				ctx.flush();
				if (dontEnd) {
					resolve();
				} else {
					writer.end();
					writer.on("close", () => resolve());
					writer.on("error", why => reject(why));
				}
			})
	);
}
