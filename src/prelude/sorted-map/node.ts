class Node<T, V> {
	pointers: Node<T, V>[];

	constructor(level: number, public readonly key: T | undefined, public value: V | undefined) {
		this.pointers = Array<Node<T, V>>(level);
	}
}

export default Node;
