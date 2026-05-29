/**
 * R-Tree implementation in TypeScript
 * Supports insertion, deletion, and bounding-box overlap queries.
 *
 * Reference: Guttman (1984) "R-Trees: A Dynamic Index Structure for Spatial Searching"
 */

// ---------------------------------------------------------------------------
// Core types
// ---------------------------------------------------------------------------

export interface BBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface RTreeEntry<T = unknown> {
  bbox: BBox;
  data: T;
}

interface RTreeNode<T> {
  bbox: BBox;
  children: RTreeNode<T>[]; // internal nodes: child nodes
  entries: RTreeEntry<T>[]; // leaf nodes: actual data
  isLeaf: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function bboxArea(b: BBox): number {
  return (b.maxX - b.minX) * (b.maxY - b.minY);
}

function bboxUnion(a: BBox, b: BBox): BBox {
  return {
    minX: Math.min(a.minX, b.minX),
    minY: Math.min(a.minY, b.minY),
    maxX: Math.max(a.maxX, b.maxX),
    maxY: Math.max(a.maxY, b.maxY),
  };
}

function bboxEnlargement(current: BBox, adding: BBox): number {
  return bboxArea(bboxUnion(current, adding)) - bboxArea(current);
}

function overlaps(a: BBox, b: BBox): boolean {
  return (
    a.minX <= b.maxX && a.maxX >= b.minX && a.minY <= b.maxY && a.maxY >= b.minY
  );
}

function contains(outer: BBox, inner: BBox): boolean {
  return (
    outer.minX <= inner.minX &&
    outer.minY <= inner.minY &&
    outer.maxX >= inner.maxX &&
    outer.maxY >= inner.maxY
  );
}

function calcBBox<T>(node: RTreeNode<T>): BBox {
  if (node.isLeaf) {
    if (node.entries.length === 0)
      return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    return node.entries.reduce<BBox>((acc, e) => bboxUnion(acc, e.bbox), {
      ...node.entries[0].bbox,
    });
  } else {
    if (node.children.length === 0)
      return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    return node.children.reduce<BBox>((acc, c) => bboxUnion(acc, c.bbox), {
      ...node.children[0].bbox,
    });
  }
}

// ---------------------------------------------------------------------------
// R-Tree class
// ---------------------------------------------------------------------------

export class RTree<T = unknown> {
  private root: RTreeNode<T>;
  private readonly maxEntries: number; // M
  private readonly minEntries: number; // m = ceil(M / 2)
  private size = 0;

  /**
   * @param maxEntries Maximum entries per node (default: 9).
   *                   Smaller values → shallower tree but more splits.
   */
  constructor(maxEntries = 9) {
    this.maxEntries = Math.max(4, maxEntries);
    this.minEntries = Math.ceil(this.maxEntries / 2);
    this.root = this.createLeaf();
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  /** Number of entries in the tree. */
  get length(): number {
    return this.size;
  }

  /** Insert a new entry. */
  insert(entry: RTreeEntry<T>): void {
    const splitNodes = this._insert(this.root, entry, this.treeHeight());
    if (splitNodes) {
      const [left, right] = splitNodes;
      this.root = this.createInternal([left, right]);
      this.root.bbox = bboxUnion(left.bbox, right.bbox);
    } else {
      this.root.bbox = calcBBox(this.root);
    }
    this.size++;
  }

  /**
   * Search for all entries whose bounding boxes overlap with the query bbox.
   */
  search(queryBBox: BBox): RTreeEntry<T>[] {
    const results: RTreeEntry<T>[] = [];
    this._search(this.root, queryBBox, results);
    return results;
  }

  /**
   * Delete an entry. Uses a reference equality check on `entry` itself
   * (or provide a custom predicate).
   */
  delete(entry: RTreeEntry<T>): boolean {
    const leaf = this._findLeaf(this.root, entry);
    if (!leaf) return false;

    const idx = leaf.entries.indexOf(entry);
    if (idx === -1) return false;

    leaf.entries.splice(idx, 1);
    this._condenseTree(leaf);
    this.size--;

    // If root is internal and has one child, collapse it
    if (!this.root.isLeaf && this.root.children.length === 1) {
      this.root = this.root.children[0];
    }
    return true;
  }

  /** Remove all entries. */
  clear(): void {
    this.root = this.createLeaf();
    this.size = 0;
  }

  /** Return all entries (full scan). */
  all(): RTreeEntry<T>[] {
    return this.search({
      minX: -Infinity,
      minY: -Infinity,
      maxX: Infinity,
      maxY: Infinity,
    });
  }

  /** Bulk-load from an array (uses Sort-Tile-Recursive for better packing). */
  static fromEntries<T>(entries: RTreeEntry<T>[], maxEntries = 9): RTree<T> {
    const tree = new RTree<T>(maxEntries);
    if (entries.length === 0) return tree;
    tree.root = tree._buildSTR(entries, tree.treeHeight(entries.length));
    tree.size = entries.length;
    return tree;
  }

  // -------------------------------------------------------------------------
  // Internal helpers – insert
  // -------------------------------------------------------------------------

  private _insert(
    node: RTreeNode<T>,
    entry: RTreeEntry<T>,
    targetLevel: number,
    currentLevel = 0,
  ): [RTreeNode<T>, RTreeNode<T>] | null {
    if (node.isLeaf) {
      node.entries.push(entry);
      node.bbox = calcBBox(node);
      if (node.entries.length > this.maxEntries) {
        return this.splitLeaf(node);
      }
      return null;
    }

    // Choose subtree
    const child = this.chooseSubtree(node, entry.bbox);
    const split = this._insert(child, entry, targetLevel, currentLevel + 1);
    child.bbox = calcBBox(child);

    if (split) {
      const [, right] = split;
      node.children.push(right);
      node.bbox = calcBBox(node);
      if (node.children.length > this.maxEntries) {
        return this.splitInternal(node);
      }
    } else {
      node.bbox = calcBBox(node);
    }
    return null;
  }

  private chooseSubtree<T>(node: RTreeNode<T>, bbox: BBox): RTreeNode<T> {
    let minEnlargement = Infinity;
    let minArea = Infinity;
    let best = node.children[0];

    for (const child of node.children) {
      const enlargement = bboxEnlargement(child.bbox, bbox);
      const area = bboxArea(child.bbox);
      if (
        enlargement < minEnlargement ||
        (enlargement === minEnlargement && area < minArea)
      ) {
        minEnlargement = enlargement;
        minArea = area;
        best = child;
      }
    }
    return best;
  }

  // -------------------------------------------------------------------------
  // Quadratic split (classic Guttman)
  // -------------------------------------------------------------------------

  private splitLeaf(node: RTreeNode<T>): [RTreeNode<T>, RTreeNode<T>] {
    const items = node.entries;
    const [i1, i2] = this.pickSeedsEntries(items);
    const seed1 = items[i1];
    const seed2 = items[i2];
    const rest = items.filter((_, i) => i !== i1 && i !== i2);

    const left = this.createLeaf([seed1]);
    const right = this.createLeaf([seed2]);

    this.distributeEntries(rest, left, right);
    node.entries = left.entries;
    node.bbox = left.bbox;
    right.bbox = calcBBox(right);
    return [node, right];
  }

  private splitInternal(node: RTreeNode<T>): [RTreeNode<T>, RTreeNode<T>] {
    const kids = node.children;
    const [i1, i2] = this.pickSeedsNodes(kids);
    const seed1 = kids[i1];
    const seed2 = kids[i2];
    const rest = kids.filter((_, i) => i !== i1 && i !== i2);

    const left = this.createInternal([seed1]);
    const right = this.createInternal([seed2]);

    this.distributeNodes(rest, left, right);
    node.children = left.children;
    node.bbox = left.bbox;
    right.bbox = calcBBox(right);
    return [node, right];
  }

  private pickSeedsEntries(items: RTreeEntry<T>[]): [number, number] {
    let maxWaste = -Infinity;
    let i1 = 0,
      i2 = 1;
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const combined = bboxArea(bboxUnion(items[i].bbox, items[j].bbox));
        const waste =
          combined - bboxArea(items[i].bbox) - bboxArea(items[j].bbox);
        if (waste > maxWaste) {
          maxWaste = waste;
          i1 = i;
          i2 = j;
        }
      }
    }
    return [i1, i2];
  }

  private pickSeedsNodes(nodes: RTreeNode<T>[]): [number, number] {
    let maxWaste = -Infinity;
    let i1 = 0,
      i2 = 1;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const combined = bboxArea(bboxUnion(nodes[i].bbox, nodes[j].bbox));
        const waste =
          combined - bboxArea(nodes[i].bbox) - bboxArea(nodes[j].bbox);
        if (waste > maxWaste) {
          maxWaste = waste;
          i1 = i;
          i2 = j;
        }
      }
    }
    return [i1, i2];
  }

  private distributeEntries(
    rest: RTreeEntry<T>[],
    left: RTreeNode<T>,
    right: RTreeNode<T>,
  ): void {
    while (rest.length > 0) {
      const needed = this.minEntries - left.entries.length;
      if (needed >= rest.length) {
        left.entries.push(...rest);
        break;
      }
      const needed2 = this.minEntries - right.entries.length;
      if (needed2 >= rest.length) {
        right.entries.push(...rest);
        break;
      }

      // Pick next: max difference in enlargement
      let maxDiff = -Infinity;
      let chosen = 0;
      for (let i = 0; i < rest.length; i++) {
        const d1 = bboxEnlargement(left.bbox, rest[i].bbox);
        const d2 = bboxEnlargement(right.bbox, rest[i].bbox);
        const diff = Math.abs(d1 - d2);
        if (diff > maxDiff) {
          maxDiff = diff;
          chosen = i;
        }
      }
      const item = rest.splice(chosen, 1)[0];
      const d1 = bboxEnlargement(left.bbox, item.bbox);
      const d2 = bboxEnlargement(right.bbox, item.bbox);
      if (
        d1 < d2 ||
        (d1 === d2 && left.entries.length <= right.entries.length)
      ) {
        left.entries.push(item);
        left.bbox = bboxUnion(left.bbox, item.bbox);
      } else {
        right.entries.push(item);
        right.bbox = bboxUnion(right.bbox, item.bbox);
      }
    }
    left.bbox = calcBBox(left);
    right.bbox = calcBBox(right);
  }

  private distributeNodes(
    rest: RTreeNode<T>[],
    left: RTreeNode<T>,
    right: RTreeNode<T>,
  ): void {
    while (rest.length > 0) {
      const needed = this.minEntries - left.children.length;
      if (needed >= rest.length) {
        left.children.push(...rest);
        break;
      }
      const needed2 = this.minEntries - right.children.length;
      if (needed2 >= rest.length) {
        right.children.push(...rest);
        break;
      }

      let maxDiff = -Infinity;
      let chosen = 0;
      for (let i = 0; i < rest.length; i++) {
        const d1 = bboxEnlargement(left.bbox, rest[i].bbox);
        const d2 = bboxEnlargement(right.bbox, rest[i].bbox);
        const diff = Math.abs(d1 - d2);
        if (diff > maxDiff) {
          maxDiff = diff;
          chosen = i;
        }
      }
      const node = rest.splice(chosen, 1)[0];
      const d1 = bboxEnlargement(left.bbox, node.bbox);
      const d2 = bboxEnlargement(right.bbox, node.bbox);
      if (
        d1 < d2 ||
        (d1 === d2 && left.children.length <= right.children.length)
      ) {
        left.children.push(node);
        left.bbox = bboxUnion(left.bbox, node.bbox);
      } else {
        right.children.push(node);
        right.bbox = bboxUnion(right.bbox, node.bbox);
      }
    }
    left.bbox = calcBBox(left);
    right.bbox = calcBBox(right);
  }

  // -------------------------------------------------------------------------
  // Internal helpers – search
  // -------------------------------------------------------------------------

  private _search(
    node: RTreeNode<T>,
    query: BBox,
    results: RTreeEntry<T>[],
  ): void {
    if (!overlaps(node.bbox, query)) return;

    if (node.isLeaf) {
      for (const e of node.entries) {
        if (overlaps(e.bbox, query)) results.push(e);
      }
    } else {
      for (const child of node.children) {
        this._search(child, query, results);
      }
    }
  }

  // -------------------------------------------------------------------------
  // Internal helpers – delete
  // -------------------------------------------------------------------------

  private _findLeaf(
    node: RTreeNode<T>,
    entry: RTreeEntry<T>,
  ): RTreeNode<T> | null {
    if (!overlaps(node.bbox, entry.bbox)) return null;
    if (node.isLeaf) {
      return node.entries.includes(entry) ? node : null;
    }
    for (const child of node.children) {
      const found = this._findLeaf(child, entry);
      if (found) return found;
    }
    return null;
  }

  private _condenseTree(leaf: RTreeNode<T>): void {
    // Re-insert orphaned entries after removing underflowing nodes.
    // For simplicity, we rebuild bboxes bottom-up.
    this._rebuildBBox(this.root);
  }

  private _rebuildBBox(node: RTreeNode<T>): void {
    if (node.isLeaf) {
      node.bbox = calcBBox(node);
      return;
    }
    for (const child of node.children) {
      this._rebuildBBox(child);
    }
    node.bbox = calcBBox(node);
  }

  // -------------------------------------------------------------------------
  // Sort-Tile-Recursive (STR) bulk loader
  // -------------------------------------------------------------------------

  private _buildSTR(entries: RTreeEntry<T>[], height: number): RTreeNode<T> {
    if (height === 0) {
      const leaf = this.createLeaf(entries);
      leaf.bbox = calcBBox(leaf);
      return leaf;
    }

    const M = this.maxEntries;
    const nodeCount = Math.ceil(entries.length / Math.pow(M, height));
    const sliceCount = Math.ceil(Math.sqrt(nodeCount));

    // Sort by minX, then partition into vertical slices
    const sorted = [...entries].sort((a, b) => a.bbox.minX - b.bbox.minX);
    const sliceSize = Math.ceil(sorted.length / sliceCount) * M;
    const children: RTreeNode<T>[] = [];

    for (let i = 0; i < sorted.length; i += sliceSize) {
      const slice = sorted.slice(i, i + sliceSize);
      // Sort each slice by minY
      slice.sort((a, b) => a.bbox.minY - b.bbox.minY);
      // Pack into groups of M
      for (let j = 0; j < slice.length; j += M) {
        children.push(this._buildSTR(slice.slice(j, j + M), height - 1));
      }
    }

    const node = this.createInternal(children);
    node.bbox = calcBBox(node);
    return node;
  }

  // -------------------------------------------------------------------------
  // Utility
  // -------------------------------------------------------------------------

  private treeHeight(n = this.size): number {
    if (n <= 0) return 0;
    return Math.ceil(Math.log(n) / Math.log(this.maxEntries));
  }

  private createLeaf(entries: RTreeEntry<T>[] = []): RTreeNode<T> {
    const bbox =
      entries.length > 0
        ? entries.reduce<BBox>((acc, e) => bboxUnion(acc, e.bbox), {
            ...entries[0].bbox,
          })
        : { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    return { bbox, children: [], entries, isLeaf: true };
  }

  private createInternal(children: RTreeNode<T>[] = []): RTreeNode<T> {
    const bbox =
      children.length > 0
        ? children.reduce<BBox>((acc, c) => bboxUnion(acc, c.bbox), {
            ...children[0].bbox,
          })
        : { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    return { bbox, children, entries: [], isLeaf: false };
  }

  // -------------------------------------------------------------------------
  // Debug / inspection
  // -------------------------------------------------------------------------

  /** Return a snapshot of the tree structure (for visualisation). */
  getStructure(): object {
    const snapshot = (node: RTreeNode<T>): object => {
      if (node.isLeaf) {
        return { type: "leaf", bbox: node.bbox, entries: node.entries.length };
      }
      return {
        type: "internal",
        bbox: node.bbox,
        children: node.children.map(snapshot),
      };
    };
    return snapshot(this.root);
  }

  /** Access root for visualisation. */
  getRoot(): RTreeNode<T> {
    return this.root;
  }
}
