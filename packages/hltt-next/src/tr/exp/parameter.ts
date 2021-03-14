import Assembler from "../../asm";
import { ProgramScope } from "../scope";
import { TrExp } from "../tr";

export class TrParameter implements TrExp {
	constructor(private readonly symbol: symbol) {}
	isConstant() {
		return undefined;
	}
	compile(asm: Assembler, ps: ProgramScope) {
		const id = ps.parameters.resolve(this.symbol);
		if (id == null) throw new TypeError(`Parameter ${String(this.symbol)} not declared`);
		asm.nthFromBottom(id);
	}
}
