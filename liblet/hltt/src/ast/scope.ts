import {
	TtFunctionScopeSolverT,
	TtGlobalScopeT,
	TtLocalScopeVariableFactoryT,
	TtProgramScopeT,
	TtScopeVariableFactoryT
} from "../scope";
import { Variable } from "./interface";
import { VkArgument, VkCvt, VkFpgm, VkStorage, VkTwilight } from "./variable-kinds";

export type TtScopeVariableFactory = TtScopeVariableFactoryT<
	Variable<VkStorage>,
	Variable<VkArgument>,
	Variable<VkFpgm>,
	Variable<VkCvt>,
	Variable<VkTwilight>
>;

export type TtFunctionScopeSolver = TtFunctionScopeSolverT<
	Variable<VkStorage>,
	Variable<VkArgument>,
	Variable<VkFpgm>,
	Variable<VkCvt>,
	Variable<VkTwilight>
>;

export class TtGlobalScope extends TtGlobalScopeT<
	Variable<VkStorage>,
	Variable<VkArgument>,
	Variable<VkFpgm>,
	Variable<VkCvt>,
	Variable<VkTwilight>
> {}

export type TtLocalScopeVariableFactory = TtLocalScopeVariableFactoryT<
	Variable<VkStorage>,
	Variable<VkArgument>,
	Variable<VkFpgm>,
	Variable<VkCvt>,
	Variable<VkTwilight>
>;

export class TtProgramScope extends TtProgramScopeT<
	Variable<VkStorage>,
	Variable<VkArgument>,
	Variable<VkFpgm>,
	Variable<VkCvt>,
	Variable<VkTwilight>
> {}

export type TtProgramScopeTy = TtProgramScopeT<
	Variable<VkStorage>,
	Variable<VkArgument>,
	Variable<VkFpgm>,
	Variable<VkCvt>,
	Variable<VkTwilight>
>;
