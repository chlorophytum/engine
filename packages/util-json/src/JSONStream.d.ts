/// <reference types="node" />

declare module "JSONStream" {
	export function parse(pattern: any): NodeJS.ReadWriteStream;
}
