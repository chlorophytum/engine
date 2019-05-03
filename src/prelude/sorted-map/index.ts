import * as util from "util";

import { Ord } from "../compare/interface";

import Node from "./node";

const P = 0.5;

export const flipCoin = (): boolean => Math.random() > P;

export const getLevel = (maxLevel: number): number => {
	let level: number = 1;
	while (flipCoin() && level < maxLevel) {
		level++;
	}
	return level;
};

export class SortedMap<T, V> implements Iterable<[T, V]> {
	head: Node<T, V>;
	level: number;
	size: number;

	constructor(level: number, private readonly order: Ord<T>) {
		this.head = new Node<T, V>(level, undefined, undefined);
		this.level = level;
		this.size = 0;
	}

	private lookup(key: T, preNodes?: null | undefined | Node<T, V>[]) {
		let matchNode = this.head;
		for (let lv = this.level; lv-- > 0; ) {
			for (;;) {
				const next = matchNode.pointers[lv];
				if (next && next.key !== undefined && this.order.compare(next.key, key) < 0) {
					matchNode = next;
				} else {
					break;
				}
			}
			// Update node will hold tempNode - used later for new value to insert
			if (preNodes) preNodes[lv] = matchNode;
		}
		return matchNode.pointers[0];
	}

	set(key: T, val: V) {
		// Start at the head node
		let preNodes: Node<T, V>[] = new Array(this.level);
		let matchNode = this.lookup(key, preNodes);

		if (!matchNode || matchNode.key === undefined || this.order.compare(matchNode.key, key)) {
			const newLevel = getLevel(this.level);
			matchNode = new Node<T, V>(newLevel, key, val);
			for (let i = 0; i < newLevel; i++) {
				matchNode.pointers[i] = preNodes[i].pointers[i];
				preNodes[i].pointers[i] = matchNode;
			}
			this.size++;
		} else {
			matchNode.value = val;
		}
	}

	delete(key: T) {
		let preNodes: Node<T, V>[] = new Array(this.level);
		let matchNode = this.lookup(key, preNodes);

		if (
			matchNode &&
			matchNode.key !== undefined &&
			this.order.compare(matchNode.key, key) === 0
		) {
			// Iterate through levels of list
			for (let i = 0; i < this.level; i++) {
				if (preNodes[i].pointers[i] === matchNode) {
					preNodes[i].pointers[i] = matchNode.pointers[i];
				}
			}
			this.size--;
		}
	}

	get(key: T) {
		let matchNode = this.lookup(key);

		if (
			matchNode &&
			matchNode.key !== undefined &&
			this.order.compare(matchNode.key, key) === 0
		) {
			return matchNode.value;
		} else {
			return undefined;
		}
	}

	*[Symbol.iterator](): IterableIterator<[T, V]> {
		let h = this.head;
		while (h) {
			if (h.key !== undefined && h.value !== undefined) yield [h.key, h.value];
			h = h.pointers[0];
		}
	}
}
