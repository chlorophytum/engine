import {
	IFinalHintProgramSink,
	IHint,
	IHintCompiler,
	IHintFactory,
	IHintTraveller,
	PropertyBag,
	TypeRep
} from "@chlorophytum/arch";
import { HlttProgramSink } from "@chlorophytum/final-hint-format-hltt";

export namespace WithDirection {
	export enum Direction {
		X = 1,
		Y = 2
	}
	export const DirectionProp = new TypeRep<Direction>(
		"Chlorophytum::CommonHints::WithDirection::DirectionProp"
	);
	const TAG = "Chlorophytum::CommonHints::WithDirection";

	export class Hint implements IHint {
		constructor(private readonly dir: Direction, private readonly inner: IHint) {}
		public toJSON() {
			return { type: TAG, dir: this.dir, inner: this.inner.toJSON() };
		}
		private createInnerBag(bag: PropertyBag) {
			const innerBag = bag.extend();
			innerBag.set(DirectionProp, this.dir);
			return innerBag;
		}
		public createCompiler(bag: PropertyBag, sink: IFinalHintProgramSink): IHintCompiler | null {
			const existingDir = bag.get(DirectionProp);
			const innerBag = this.createInnerBag(bag);

			const innerCompiler = this.inner.createCompiler(innerBag, sink);
			if (!innerCompiler) return null;

			if (sink instanceof HlttProgramSink) {
				return new HlttCompiler(existingDir !== this.dir, sink, this.dir, innerCompiler);
			}
			return null;
		}
		public traverse(bag: PropertyBag, traveller: IHintTraveller) {
			traveller.traverse(this.createInnerBag(bag), this.inner);
		}
	}
	export function Y(inner: IHint) {
		return new Hint(Direction.Y, inner);
	}
	export function X(inner: IHint) {
		return new Hint(Direction.X, inner);
	}

	export class HintFactory implements IHintFactory {
		public readonly type = TAG;
		public readJson(json: any, general: IHintFactory) {
			if (json && json.type === TAG && json.inner) {
				const inner = general.readJson(json.inner, general);
				if (inner) return new Hint(json.dir, inner);
			}
			return null;
		}
	}

	export class HlttCompiler implements IHintCompiler {
		constructor(
			private readonly explicit: boolean,
			private readonly sink: HlttProgramSink,
			private readonly dir: Direction,
			private readonly innerCompiler: IHintCompiler
		) {}
		public doCompile() {
			if (this.explicit) {
				if (this.dir === Direction.Y) {
					this.sink.addSegment($ => [$.svtca.y()]);
				} else {
					this.sink.addSegment($ => [$.svtca.x()]);
				}
			}
			this.innerCompiler.doCompile();
		}
	}
}
