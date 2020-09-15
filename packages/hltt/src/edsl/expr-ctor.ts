import { BinaryExpression, NullaryExpression, UnaryExpression } from "../ast/expression/arith";
import { cExpr, cExprArr } from "../ast/expression/constant";
import { InvokeExpression } from "../ast/expression/invoke";
import { ArrayInit, CoercedVariable } from "../ast/expression/pointer";
import { VariableSet } from "../ast/expression/variable";
import {
	Expression,
	PtrExpression,
	Statement,
	Variable,
	VarKind,
	VkCvt,
	VkFpgm,
	VkStorage
} from "../ast/interface";
import { GCExpression, SCFSStatement } from "../ast/statement/coord";
import { DeltaStatement } from "../ast/statement/deltas";
import {
	GraphStateStatement,
	GraphStateStatement1,
	IupStatement
} from "../ast/statement/graph-state";
import { LIp, LMdap, LMdrp, LMiap, LMirp } from "../ast/statement/move-point";
import { TTI } from "../instr";
import { mxapFunctionSys, mxrpFunctionSys } from "./flags";

export type NExpr = number | Expression;
type PtrCvt = PtrExpression<VkCvt>;

export class DslConstructor {
	// Assignments
	public set<A extends VarKind>(a: Variable<A>, x: NExpr): Statement {
		return new VariableSet(a, x);
	}
	public setArr<A extends VarKind>(a: Variable<A>, x: Iterable<NExpr>): Statement {
		return new ArrayInit(a.ptr, x);
	}

	// Point movement
	public mdap = mxapFunctionSys(function (r, x: NExpr) {
		return new LMdap(r, cExpr(x));
	});
	public miap = mxapFunctionSys(function (r, x: NExpr, cv: PtrCvt) {
		return new LMiap(r, cExpr(x), cv);
	});
	public mdrp = mxrpFunctionSys(function (rp0, md, rnd, mode, p0: NExpr, p1: NExpr) {
		return new LMdrp(rp0, md, rnd, mode, cExpr(p0), cExpr(p1));
	});
	public mirp = mxrpFunctionSys(function (rp0, md, r, mode, p0: NExpr, p1: NExpr, cv: PtrCvt) {
		return new LMirp(rp0, md, r, mode, cExpr(p0), cExpr(p1), cv);
	});
	public ip(p1: NExpr, p2: NExpr, ...p: NExpr[]): Statement {
		return new LIp(cExpr(p1), cExpr(p2), cExprArr(p));
	}

	// Binary
	public add(a: NExpr, b: NExpr): Expression {
		return BinaryExpression.Add(cExpr(a), cExpr(b));
	}
	public sub(a: NExpr, b: NExpr): Expression {
		return BinaryExpression.Sub(cExpr(a), cExpr(b));
	}
	public mul(a: NExpr, b: NExpr): Expression {
		return BinaryExpression.Mul(cExpr(a), cExpr(b));
	}
	public div(a: NExpr, b: NExpr): Expression {
		return BinaryExpression.Div(cExpr(a), cExpr(b));
	}
	public max(a: NExpr, b: NExpr): Expression {
		return BinaryExpression.Max(cExpr(a), cExpr(b));
	}
	public min(a: NExpr, b: NExpr): Expression {
		return BinaryExpression.Min(cExpr(a), cExpr(b));
	}
	public lt(a: NExpr, b: NExpr): Expression {
		return BinaryExpression.Lt(cExpr(a), cExpr(b));
	}
	public lteq(a: NExpr, b: NExpr): Expression {
		return BinaryExpression.Lteq(cExpr(a), cExpr(b));
	}
	public gt(a: NExpr, b: NExpr): Expression {
		return BinaryExpression.Gt(cExpr(a), cExpr(b));
	}
	public gteq(a: NExpr, b: NExpr): Expression {
		return BinaryExpression.Gteq(cExpr(a), cExpr(b));
	}
	public eq(a: NExpr, b: NExpr): Expression {
		return BinaryExpression.Eq(cExpr(a), cExpr(b));
	}
	public neq(a: NExpr, b: NExpr): Expression {
		return BinaryExpression.Neq(cExpr(a), cExpr(b));
	}
	public and(a: NExpr, b: NExpr): Expression {
		return BinaryExpression.And(cExpr(a), cExpr(b));
	}
	public or(a: NExpr, b: NExpr): Expression {
		return BinaryExpression.Or(cExpr(a), cExpr(b));
	}

	// Binary-then-set
	public addSet<A extends VarKind>(a: Variable<A>, x: NExpr): Statement {
		return new VariableSet(a, BinaryExpression.Add(a, cExpr(x)));
	}
	public subSet<A extends VarKind>(a: Variable<A>, x: NExpr): Statement {
		return new VariableSet(a, BinaryExpression.Sub(a, cExpr(x)));
	}
	public mulSet<A extends VarKind>(a: Variable<A>, x: NExpr): Statement {
		return new VariableSet(a, BinaryExpression.Mul(a, cExpr(x)));
	}
	public divSet<A extends VarKind>(a: Variable<A>, x: NExpr): Statement {
		return new VariableSet(a, BinaryExpression.Div(a, cExpr(x)));
	}

	// Unary
	public abs(a: NExpr): Expression {
		return UnaryExpression.Abs(cExpr(a));
	}
	public neg(a: NExpr): Expression {
		return UnaryExpression.Neg(cExpr(a));
	}
	public floor(a: NExpr): Expression {
		return UnaryExpression.Floor(cExpr(a));
	}
	public ceiling(a: NExpr): Expression {
		return UnaryExpression.Ceiling(cExpr(a));
	}
	public even(a: NExpr): Expression {
		return UnaryExpression.Even(cExpr(a));
	}
	public odd(a: NExpr): Expression {
		return UnaryExpression.Odd(cExpr(a));
	}
	public not(a: NExpr): Expression {
		return UnaryExpression.Not(cExpr(a));
	}
	public getInfo(a: NExpr): Expression {
		return UnaryExpression.GetInfo(cExpr(a));
	}
	public round = {
		gray(a: NExpr): Expression {
			return UnaryExpression.RoundGray(cExpr(a));
		},
		black(a: NExpr): Expression {
			return UnaryExpression.RoundBlack(cExpr(a));
		},
		white(a: NExpr): Expression {
			return UnaryExpression.RoundWhite(cExpr(a));
		},
		mode3(a: NExpr): Expression {
			return UnaryExpression.RoundUndef4(cExpr(a));
		}
	};
	public nRound = {
		gray(a: NExpr): Expression {
			return UnaryExpression.NRoundGray(cExpr(a));
		},
		black(a: NExpr): Expression {
			return UnaryExpression.NRoundBlack(cExpr(a));
		},
		white(a: NExpr): Expression {
			return UnaryExpression.NRoundWhite(cExpr(a));
		},
		mode3(a: NExpr): Expression {
			return UnaryExpression.NRoundUndef4(cExpr(a));
		}
	};

	// Direct manipulation
	public gc = {
		cur(a: NExpr): Expression {
			return new GCExpression(cExpr(a), TTI.GC_cur);
		},
		orig(a: NExpr): Expression {
			return new GCExpression(cExpr(a), TTI.GC_orig);
		}
	};
	public scfs(a: NExpr, b: NExpr): Statement {
		return new SCFSStatement(cExpr(a), cExpr(b));
	}

	// Calls
	public apply(fn: Variable<VkFpgm>, parts: Iterable<NExpr>): Expression {
		return new InvokeExpression(fn, cExprArr(parts));
	}

	// Deltas
	public delta = {
		p1(...a: [NExpr, NExpr][]): Statement {
			return new DeltaStatement(
				TTI.DELTAP1,
				true,
				cExprArr(a.map(x => x[0])),
				cExprArr(a.map(x => x[1]))
			);
		},
		p2(...a: [NExpr, NExpr][]): Statement {
			return new DeltaStatement(
				TTI.DELTAP2,
				true,
				cExprArr(a.map(x => x[0])),
				cExprArr(a.map(x => x[1]))
			);
		},
		p3(...a: [NExpr, NExpr][]): Statement {
			return new DeltaStatement(
				TTI.DELTAP3,
				true,
				cExprArr(a.map(x => x[0])),
				cExprArr(a.map(x => x[1]))
			);
		},
		c1(...a: [number | PtrExpression<VkCvt>, NExpr][]): Statement {
			return new DeltaStatement(
				TTI.DELTAC1,
				false,
				cExprArr(a.map(x => x[0])),
				cExprArr(a.map(x => x[1]))
			);
		},
		c2(...a: [number | PtrExpression<VkCvt>, NExpr][]): Statement {
			return new DeltaStatement(
				TTI.DELTAC2,
				false,
				cExprArr(a.map(x => x[0])),
				cExprArr(a.map(x => x[1]))
			);
		},
		c3(...a: [number | PtrExpression<VkCvt>, NExpr][]): Statement {
			return new DeltaStatement(
				TTI.DELTAC3,
				false,
				cExprArr(a.map(x => x[0])),
				cExprArr(a.map(x => x[1]))
			);
		}
	};

	// Measure
	public mppem(): Expression {
		return new NullaryExpression(TTI.MPPEM);
	}
	public mps(): Expression {
		return new NullaryExpression(TTI.MPS);
	}

	// Conversion
	public toFloat(a: NExpr): Expression {
		return BinaryExpression.Mul(cExpr(64 * 64), cExpr(a));
	}

	// Graphic state
	public svtca = {
		x(): Statement {
			return new GraphStateStatement(TTI.SVTCA_x);
		},
		y(): Statement {
			return new GraphStateStatement(TTI.SVTCA_y);
		}
	};
	public iup = {
		x(): Statement {
			return new IupStatement(TTI.IUP_x);
		},
		y(): Statement {
			return new IupStatement(TTI.IUP_y);
		}
	};
	// Raw graphic state
	public rawState = {
		szp0(a: NExpr): Statement {
			return new GraphStateStatement1(TTI.SZP0, cExpr(a));
		},
		szp1(a: NExpr): Statement {
			return new GraphStateStatement1(TTI.SZP1, cExpr(a));
		},
		szp2(a: NExpr): Statement {
			return new GraphStateStatement1(TTI.SZP2, cExpr(a));
		}
	};

	// NOP
	public emptyBlock = () => function* (): Iterable<Statement> {};

	// Coercions
	public coerce = {
		fromIndex: {
			cvt(e: NExpr): Variable<VkCvt> {
				return new CoercedVariable<VkCvt>(cExpr(e), new VkCvt());
			},
			variable(e: NExpr, size = 1): Variable<VkStorage> {
				return new CoercedVariable<VkStorage>(cExpr(e), new VkStorage(), size);
			}
		},
		toF26D6(x: number) {
			return Math.round(x * 64);
		}
	};
}
