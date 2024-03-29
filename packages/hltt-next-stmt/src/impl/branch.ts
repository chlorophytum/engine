import { Expr, ExprImpl, Stmt } from "@chlorophytum/hltt-next-expr-impl";
import {
	TrAlternative,
	TrConst,
	TrExprStmt,
	TrIf,
	TrSeq,
	TrWhile
} from "@chlorophytum/hltt-next-tr";
import { Bool } from "@chlorophytum/hltt-next-type-system";

export type AnyStmt = number | boolean | Expr<unknown> | Stmt;
export type StmtBody = AnyStmt | (() => Iterable<AnyStmt>);
function isStmt(x: Stmt | Expr<unknown>): x is Stmt {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return !(x as any).type;
}
export function castExprStmt(x: AnyStmt): Stmt {
	if (typeof x === "number" || typeof x === "boolean") return new Stmt(new TrSeq(false, []));
	if (isStmt(x)) return x;
	else return new Stmt(new TrExprStmt(x.tr));
}
function reduceStmtBody(sb: StmtBody): Stmt[] {
	if (sb instanceof Function) return [...sb()].map(castExprStmt);
	else return [castExprStmt(sb)];
}

function castBool(x: boolean | Expr<Bool>) {
	if (typeof x === "boolean") return ExprImpl.create(Bool, new TrConst(x ? 1 : 0));
	else return x;
}

export function StatementBlock(body: StmtBody) {
	return new Stmt(new TrAlternative(reduceStmtBody(body).map(x => x.tr)));
}

export function If(x: boolean | Expr<Bool>) {
	return new IfStmt(castBool(x), null, null);
}
export class IfStmt extends Stmt {
	constructor(
		private readonly condition: Expr<Bool>,
		private readonly consequence: null | Stmt[],
		private readonly alternate: null | Stmt[]
	) {
		super(
			new TrIf(
				condition.tr,
				consequence ? new TrAlternative(consequence.map(x => x.tr)) : null,
				alternate ? new TrAlternative(alternate.map(x => x.tr)) : null
			)
		);
	}
	Then(sb: StmtBody) {
		return new IfStmt(this.condition, reduceStmtBody(sb), this.alternate);
	}
	Else(sb: StmtBody) {
		return new IfStmt(this.condition, this.consequence, reduceStmtBody(sb));
	}
}

export function While(c: boolean | Expr<Bool>, body: StmtBody) {
	return new Stmt(
		new TrWhile(castBool(c).tr, new TrAlternative(reduceStmtBody(body).map(x => x.tr)))
	);
}
