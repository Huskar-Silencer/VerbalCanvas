class LinkedListNode<K, V> {
  key: K;
  value: V;
  prev: LinkedListNode<K, V> | null = null;
  next: LinkedListNode<K, V> | null = null;

  constructor(key: K, value: V) {
    this.key = key;
    this.value = value;
  }
}

export class MapLinkedListIterator<K, V> {
  private currentNode: LinkedListNode<K, V> | null;

  constructor(startNode: LinkedListNode<K, V> | null) {
    this.currentNode = startNode;
  }

  public hasNext(): boolean {
    return this.currentNode?.next !== null;
  }

  public hasPrev(): boolean {
    return this.currentNode?.prev !== null;
  }

  public getKey(): K | null {
    return this.currentNode ? this.currentNode.key : null;
  }

  public getValue(): V | null {
    return this.currentNode ? this.currentNode.value : null;
  }

  public next(): { key: K; value: V } | null {
    if (!this.currentNode) return null;
    const result = { key: this.currentNode.key, value: this.currentNode.value };
    this.currentNode = this.currentNode.next;
    return result;
  }

  public prev(): { key: K; value: V } | null {
    if (!this.currentNode) return null;
    const result = { key: this.currentNode.key, value: this.currentNode.value };
    this.currentNode = this.currentNode.prev;
    return result;
  }
}

export class MapLinkedList<K, V> {
  private map: Map<K, LinkedListNode<K, V>> = new Map();
  private head: LinkedListNode<K, V> | null = null;
  private tail: LinkedListNode<K, V> | null = null;

  constructor() {}

  public insertTail(key: K, value: V) {
    if (this.map.size === 0) {
      const newNode = new LinkedListNode(key, value);
      this.head = newNode;
      this.tail = newNode;
      this.map.set(key, newNode);
      return;
    }

    if (this.map.has(key)) {
      const node = this.map.get(key)!;
      node.value = value;
      return;
    }

    const newNode = new LinkedListNode(key, value);
    this.tail!.next = newNode;
    newNode.prev = this.tail;
    this.tail = newNode;
    this.map.set(key, newNode);
  }

  public delete(key: K) {
    if (!this.map.has(key)) return;
    const node = this.map.get(key)!;
    if (node.prev) node.prev.next = node.next;
    if (node.next) node.next.prev = node.prev;
    if (node === this.head) this.head = node.next;
    if (node === this.tail) this.tail = node.prev;
    this.map.delete(key);
  }

  public moveStepNext(key: K) {
    if (!this.map.has(key)) return;
    const node = this.map.get(key)!;
    if (node === this.tail) return;

    const nextNode = node.next!;
    const prevNode = node.prev;
    const nNextNode = nextNode.next;

    nextNode.prev = prevNode;
    if (prevNode) prevNode.next = nextNode;
    nextNode.next = node;
    node.prev = nextNode;
    node.next = nNextNode;
    if (nNextNode) nNextNode.prev = node;
    if (node === this.head) this.head = nextNode;
    if (nextNode === this.tail) this.tail = node;
  }

  public moveStepPrev(key: K) {
    if (!this.map.has(key)) return;
    const node = this.map.get(key)!;
    if (node === this.head) return;

    const prevNode = node.prev!;
    const nextNode = node.next;
    const pPrevNode = prevNode.prev;

    prevNode.next = nextNode;
    if (nextNode) nextNode.prev = prevNode;
    prevNode.prev = node;
    node.next = prevNode;
    node.prev = pPrevNode;
    if (pPrevNode) pPrevNode.next = node;
    if (node === this.tail) this.tail = prevNode;
    if (prevNode === this.head) this.head = node;
  }

  public getSize(): number {
    return this.map.size;
  }
}
