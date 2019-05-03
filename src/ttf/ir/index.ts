export type TtfSymbolTable = { [key: string]: number };
export interface TtfInstr {
	label?: string;
	size: number; // in bytes
	toBytes(symbolTable: TtfSymbolTable): void;
}
export interface TtfIR {
	localSymbols: TtfSymbolTable;
	instructions: TtfInstr[];
}
