import {
	IArbitratorProxy,
	IFontSource,
	IHintFactory,
	IHintingModel,
	IHintingModelExecEnv,
	IHintingModelPlugin,
	IHintingModelPreEnv,
	IHintingPass,
	IHintStore,
	ITask,
	Plugins
} from "@chlorophytum/arch";
import { MemoryHintStore } from "@chlorophytum/hint-store-memory";

export interface SubpassOption {
	hintPlugin: string;
	hintOptions: any;
}
export interface CombineOptions {
	passes: SubpassOption[];
}

export class CHmCombinedPlugin implements IHintingModelPlugin {
	public async load(_parameters: any) {
		if (!_parameters.passes) throw new Error("Must specify passes.");
		const parameters: CombineOptions = _parameters;
		const subpasses: IHintingPass[] = [];
		for (const sp of parameters.passes) {
			const plugin: Plugins.HintingModelModule = require(sp.hintPlugin);
			subpasses.push(await plugin.HintingModelPlugin.load(sp.hintOptions));
		}
		return new CCombinedHintPass(subpasses);
	}
}

export class CCombinedHintPass implements IHintingPass {
	constructor(private readonly subpasses: readonly IHintingPass[]) {
		this.requirePreHintRounds = 0;
		this.factoriesOfUsedHints = [];
		for (const sp of subpasses) {
			if (this.requirePreHintRounds < sp.requirePreHintRounds) {
				this.requirePreHintRounds = sp.requirePreHintRounds;
			}
			for (const hf of sp.factoriesOfUsedHints) this.factoriesOfUsedHints.push(hf);
		}
	}
	public adopt<GID>(font: IFontSource<GID>) {
		const subModels: IHintingModel[] = [];
		for (const subpass of this.subpasses) {
			const model = subpass.adopt(font);
			if (model) subModels.push(model);
		}
		return new CCombinedHintingModel(subModels);
	}
	public createParallelTask<RepArg>(type: string, args: RepArg) {
		for (const subpass of this.subpasses) {
			const pt = subpass.createParallelTask(type, args);
			if (pt) return pt;
		}
		return null;
	}

	public readonly requirePreHintRounds: number;
	public readonly factoriesOfUsedHints: IHintFactory[];
}

const TypePrefix = `@chlorophytum/hm-combine::CCombinedHintingModel`;

export class CCombinedHintingModel implements IHintingModel {
	constructor(private readonly subModels: IHintingModel[]) {
		let type = `${TypePrefix}{${subModels.map(x => x.type).join(",")}}`;
		this.type = type;
	}
	public getPreTask(env: IHintingModelPreEnv) {
		const tasks: ITask<unknown>[] = [];
		for (const model of this.subModels) {
			if (!model.getPreTask) continue;
			const st = model.getPreTask(env);
			if (!st) continue;
			tasks.push(st);
		}
		if (tasks.length) {
			return new CCombinedTask(tasks);
		} else {
			return null;
		}
	}
	public getHintingTask(env: IHintingModelExecEnv) {
		const tasks: ITask<unknown>[] = [];
		const localHintStores: MemoryHintStore[] = [];
		for (const model of this.subModels) {
			if (!model.getPreTask) continue;
			const lhs = new MemoryHintStore();
			const st = model.getHintingTask({ ...env, hintStore: lhs });
			if (!st) continue;
			tasks.push(st);
		}
		if (tasks.length) {
			return new CCombinedHintTask(tasks, localHintStores, env.hintStore);
		} else {
			return null;
		}
	}

	public readonly type: string;
}

class CCombinedTask implements ITask<unknown> {
	constructor(protected tasks: ITask<unknown>[]) {}
	public async execute(arb: IArbitratorProxy) {
		for (const task of this.tasks) await task.execute(arb);
		return null;
	}
}

class CCombinedHintTask extends CCombinedTask {
	constructor(
		tasks: ITask<unknown>[],
		private readonly localHintStores: MemoryHintStore[],
		private readonly upstream: IHintStore
	) {
		super(tasks);
	}
	public async execute(arb: IArbitratorProxy) {
		super.execute(arb);
		for (const lhs of this.localHintStores) {
			this.combineHintStore(lhs, this.upstream);
		}
		return null;
	}

	private async combineHintStore(from: IHintStore, to: IHintStore) {
		for (const g of await from.listGlyphs()) {
			if (await to.getGlyphHints(g)) continue;
			const gh = await from.getGlyphHints(g);
			if (gh) to.setGlyphHints(g, gh);
			const ck = await from.getGlyphHintsCacheKey(g);
			if (ck) to.setGlyphHintsCacheKey(g, ck);
		}
		for (const st of await from.listSharedTypes()) {
			if (await to.getSharedHints(st)) continue;
			const sh = await from.getSharedHints(st);
			if (sh) to.setSharedHints(st, sh);
		}
	}
}

export const HintingModelPlugin = new CHmCombinedPlugin();
