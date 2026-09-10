<img width="2730" height="1162" alt="banner" src="https://github.com/user-attachments/assets/5e54bfaa-f9c8-484f-a02b-938005872e51" />

# VerbalCanvas

A lightweight graphics library built on the native Canvas 2D API. It provides an object-oriented node tree + layer + event model for building interactive canvas applications (flowcharts, whiteboards, visual editors, and more).

## Features

- **Node tree**: `Holder → Layer → nodes`, with `Group` grouping and z-order support.
- **Transforms**: position (`position`), scale (`scaleX`/`scaleY`) and rotation (`rotation`), all applied around the node's center point.
- **Rendering**: per-frame auto clear + batched repaint (coalesced via `requestAnimationFrame`).
- **Hit detection**: built-in R-Tree spatial index + exact geometry tests, correct under rotation and scaling.
- **Events**: pointer events, hover/leave, click, bubbling up the node tree, with `stopPropagation` support.
- **Interactions**: drag (`Dragger`) and resize/rotate handles (`Transformer`).
- **Custom shapes**: `CustomShape` lets you define custom drawing and hit-test logic.
- **HiDPI**: renders with `devicePixelRatio` scaling for crisp output on high-density screens.

## Getting Started

```bash
npm install
npm run dev      # dev preview
npm run build  # production build
```

Minimal example:

```ts
import { CanvasHolder } from "./src/core/CanvasHolder";
import { CanvasLayer } from "./src/core/CanvasLayer";
import { Rectangle } from "./src/shapes/Rectangle";

const container = document.getElementById("app")!;

const holder = new CanvasHolder({
  containerDom: container,
  width: 800,
  height: 600,
});
const layer = new CanvasLayer();
holder.addChild(layer);
holder.enableEvent();

layer.addChild(
  new Rectangle({
    position: { x: 100, y: 100 },
    width: 160,
    height: 120,
    rotation: 15,
    style: { fillStyle: "#3b82f6", strokeStyle: "#1d4ed8", lineWidth: 2 },
  }),
);
```

## Core Concepts

### Node Tree

```
CanvasHolder (root container; binds a DOM element and dispatches events)
  └── CanvasLayer (a layer backed by one <canvas>, owns the R-Tree index)
        ├── Rectangle
        ├── Ellipse
        ├── Line
        ├── CustomShape
        └── Group (can nest more children)
```

- `CanvasHolder`: root container holding one or more layers; attaches the layer canvas to the DOM and dispatches pointer events.
- `CanvasLayer`: a standalone canvas that maintains its own spatial index and batched repaint.
- Every node extends `CanvasWidget` and shares position/transform/style/event capabilities.

### Base Attributes

Every node constructor accepts `CanvasWidgetBaseAttrConfig`:

| Field               | Type                      | Description                                               |
| ------------------- | ------------------------- | --------------------------------------------------------- |
| `position`          | `{ x, y }`                | Position                                                  |
| `scaleX` / `scaleY` | `number`                  | Scale (default `1`)                                       |
| `rotation`          | `number`                  | Rotation in degrees around the center point (default `0`) |
| `style`             | `CanvasWidgetStyleConfig` | Style                                                     |

Style fields: `fillStyle`, `strokeStyle`, `lineWidth`, `globalAlpha`, `shadowColor`, `shadowBlur`, `shadowOffsetX`, `shadowOffsetY`.

### Updating Attributes

```ts
rect.updateAttrConfig({ position: { x: 200, y: 200 }, rotation: 45 });
rect.updateAttrConfig({ style: { fillStyle: "#10b981" } });
rect.setVisible(false); // hide (excluded from rendering and hit testing)
rect.setEnableEvent(false); // disable events (still auto-repaints on change)
```

## Shapes

### Rectangle

```ts
new Rectangle({
  position: { x: 100, y: 100 },
  width: 160,
  height: 100,
  style: { fillStyle: "#3b82f6" },
});
```

### Ellipse

```ts
new Ellipse({
  position: { x: 200, y: 200 },
  rx: 80, // horizontal radius
  ry: 60, // vertical radius
  style: { fillStyle: "#f59e0b" },
});
```

### Line

```ts
new Line({
  p1: { x: 100, y: 300 },
  p2: { x: 400, y: 260 },
  style: { strokeStyle: "#ef4444", lineWidth: 4 },
});
```

### CustomShape

Define custom drawing and hit-test logic:

```ts
new CustomShape({
  position: { x: 300, y: 300 },
  width: 90,
  height: 80,
  style: { fillStyle: "#ec4899" },
  customPaintFn: (ctx) => {
    ctx.beginPath();
    ctx.moveTo(0, 80);
    ctx.lineTo(45, 0);
    ctx.lineTo(90, 80);
    ctx.closePath();
    ctx.fill();
  },
  hitTestFn: (p) => p.x >= 0 && p.x <= 90 && p.y >= 0 && p.y <= 80, // optional, defaults to bbox
});
```

> `customPaintFn` receives the raw `CanvasRenderingContext2D` with the transform and style already applied, so you can draw directly.

## Groups

```ts
const group = new Group({});
group.addChild(
  new Rectangle({ position: { x: 0, y: 0 }, width: 46, height: 46 }),
  new Rectangle({ position: { x: 56, y: 0 }, width: 46, height: 46 }),
);
group.updateAttrConfig({ position: { x: 500, y: 400 }, rotation: -15 });
layer.addChild(group);
```

- Child coordinates are relative to the `Group` itself.
- A `Group` automatically computes its center point from its children's bounding box, so rotation/scale happen around the content center.

## Events

Subscribe to events via `CanvasWidgetEventTypeEnum`:

| Event                                       | Fired when                                                               |
| ------------------------------------------- | ------------------------------------------------------------------------ |
| `PointerDown` / `PointerMove` / `PointerUp` | Pointer pressed / moved / released                                       |
| `OnClick`                                   | Press and release land on the same node                                  |
| `Hover` / `HoverOut`                        | Pointer enters / leaves a node                                           |
| `OnChange`                                  | Node attributes or hierarchy change (used internally to trigger repaint) |

```ts
import { CanvasWidgetEventTypeEnum } from "./src/core/CanvasWidget";

rect.addEvent(CanvasWidgetEventTypeEnum.OnClick, (ev) => {
  console.log("clicked", ev.targetWidget);
  ev.stopPropagation(); // block remaining handlers and further bubbling
});

rect.addEvent(CanvasWidgetEventTypeEnum.Hover, () => {
  rect.updateAttrConfig({ style: { strokeStyle: "#f59e0b" } });
});
```

The `CanvasWidgetEvent` object exposes `targetWidget`, `currentWidget`, `nativeEvent`, and `point` (world coordinates).

> Only nodes with `enableEvent` and `visible` both `true` can be hit.

## Interaction

### Dragger

```ts
const dragger = new Dragger();
dragger.linkTo(rect); // bind, then the node becomes draggable
dragger.removeChild(); // unbind
```

### Transformer

```ts
const transformer = new Transformer();
transformer.linkToChild(rect);

// call within a pointer handler; resizeType is one of TransformTypeEnum
transformer.transformHandle(TransformTypeEnum.BottomRightResize, { x, y });
transformer.transformHandle(TransformTypeEnum.Rotate, { x, y });
```

## Hit Detection & Spatial Index

```ts
const hit = layer.checkPointInWidget({ x, y }); // topmost node at the point (or null)
const isHit = rect.isPointInShape({ x, y }); // boolean test
```

`CanvasLayer` uses an **R-Tree** to coarsely filter its direct children, then runs exact per-node tests, avoiding a full linear scan on large scenes.

## Project Structure

```
src/
├── core/
│   ├── CanvasWidget.ts          # node base class (transform/style/event/hit)
│   ├── CanvasContainerWidget.ts # container base class
│   ├── CanvasShapeWidget.ts     # shape base class
│   ├── CanvasLayer.ts           # layer + R-Tree
│   ├── CanvasHolder.ts          # root container + event dispatch
│   ├── CanvasPainter.ts         # Canvas 2D context wrapper
│   └── Group.ts
├── shapes/
│   ├── Rectangle.ts
│   ├── Ellipse.ts
│   ├── Line.ts
│   └── CustomShape.ts
├── other/
│   ├── Dragger.ts
│   ├── Transformer.ts
│   └── Utils.ts
├── VerbalRTree.ts               # R-Tree implementation
├── MapLinkedList.ts             # ordered doubly linked list (for z-order)
├── Aggregation.ts               # unified VerbalCanvas export
├── index.ts                     # example entry
└── index.html
```
