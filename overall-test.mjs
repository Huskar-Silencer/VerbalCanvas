const canvasCtx = {
  save() {}, restore() {}, translate() {}, rotate() {}, scale() {},
  transform() {}, setTransform() {}, beginPath() {}, moveTo() {},
  lineTo() {}, rect() {}, ellipse() {}, fill() {}, stroke() {},
  clearRect() {}, closePath() {}, arc() {},
};

function makeCanvas() {
  return {
    style: {}, width: 0, height: 0,
    getContext: () => canvasCtx,
    addEventListener() {}, removeEventListener() {}, remove() {},
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 }),
    appendChild() {},
  };
}

function makeEl() {
  return {
    style: {}, addEventListener() {}, removeEventListener() {}, remove() {},
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 }),
    appendChild() {},
  };
}

globalThis.document = {
  createElement: (t) => (t === "canvas" ? makeCanvas() : makeEl()),
  addEventListener() {}, removeEventListener() {},
};
globalThis.window = {
  devicePixelRatio: 1, innerWidth: 800, innerHeight: 600,
  addEventListener() {}, removeEventListener() {},
};
globalThis.requestAnimationFrame = (cb) => { cb(); return 0; };

const { SnowflakeId } = await import("./src/other/Utils.ts");
const { Rectangle } = await import("./src/shapes/Rectangle.ts");
const { Ellipse } = await import("./src/shapes/Ellipse.ts");
const { Line } = await import("./src/shapes/Line.ts");
const { CustomShape } = await import("./src/shapes/CustomShape.ts");
const { Group } = await import("./src/core/Group.ts");
const { CanvasLayer } = await import("./src/core/CanvasLayer.ts");
const { Dragger } = await import("./src/other/Dragger.ts");
const { Transformer, TransformTypeEnum } = await import("./src/other/Transformer.ts");
const { CanvasWidgetEventTypeEnum } = await import("./src/core/CanvasWidget.ts");
const { Animation } = await import("./src/other/Animation.ts");

let passed = 0, failed = 0;
function ok(cond, msg) {
  if (cond) { passed++; console.log("  PASS " + msg); }
  else { failed++; console.log("  FAIL " + msg); }
}
function approx(a, b, eps = 1e-6) { return Math.abs(a - b) < eps; }

console.log("[1] SnowflakeId");
{
  const idGen = new SnowflakeId();
  const ids = new Set();
  for (let i = 0; i < 1000; i++) ids.add(idGen.generate());
  ok(ids.size === 1000, "1000 unique ids, typeof string");
  ok(typeof idGen.generate() === "string", "id is string");
}

console.log("[2] shape bbox/center");
{
  const r = new Rectangle({ position: { x: 100, y: 100 }, width: 100, height: 50 });
  ok(approx(r.getCenterPoint().x, 150) && approx(r.getCenterPoint().y, 125), "rect center = position + size/2");
  ok(approx(r.getBboxConfig().width, 100) && approx(r.getBboxConfig().height, 50), "rect bbox");

  const e = new Ellipse({ position: { x: 0, y: 0 }, rx: 40, ry: 20 });
  ok(approx(e.getCenterPoint().x, 40) && approx(e.getCenterPoint().y, 20), "ellipse center = radius");
  ok(approx(e.getBboxConfig().width, 80) && approx(e.getBboxConfig().height, 40), "ellipse bbox = 2r");

  const l = new Line({ p1: { x: 0, y: 0 }, p2: { x: 100, y: 0 } });
  ok(approx(l.getCenterPoint().x, 50) && approx(l.getCenterPoint().y, 0), "line center = midpoint");
  ok(approx(l.getBboxConfig().width, 100), "line bbox width");
}

console.log("[3] isPointInShape");
{
  const r = new Rectangle({ position: { x: 100, y: 100 }, width: 100, height: 100 });
  ok(r.isPointInShape({ x: 150, y: 150 }) === true, "rect inside");
  ok(r.isPointInShape({ x: 50, y: 50 }) === false, "rect outside");

  const rot = new Rectangle({ position: { x: 100, y: 100 }, width: 100, height: 50, rotation: 90 });
  ok(rot.isPointInShape({ x: 150, y: 125 }) === true, "rotated rect center hit");
  ok(rot.isPointInShape({ x: 100, y: 100 }) === false, "rotated rect corner (rotated away) miss");

  const e = new Ellipse({ position: { x: 0, y: 0 }, rx: 50, ry: 50 });
  ok(e.isPointInShape({ x: 50, y: 50 }) === true, "ellipse center");
  ok(e.isPointInShape({ x: 101, y: 50 }) === false, "ellipse edge outside");

  const l = new Line({ p1: { x: 0, y: 0 }, p2: { x: 100, y: 0 } });
  ok(l.isPointInShape({ x: 50, y: 2 }) === true, "line near hit (tolerance)");
  ok(l.isPointInShape({ x: 50, y: 20 }) === false, "line far miss");
}

console.log("[4] transform roundtrip via world bbox");
{
  const r = new Rectangle({ position: { x: 100, y: 100 }, width: 100, height: 50, rotation: 90 });
  const b = r.getWorldBbox();
  ok(approx(b.minX, 125) && approx(b.maxX, 175), "rot90 world bbox X = [125,175]");
  ok(approx(b.minY, 75) && approx(b.maxY, 175), "rot90 world bbox Y = [75,175]");

  const s = new Rectangle({ position: { x: 100, y: 100 }, width: 100, height: 50, scaleX: 2, scaleY: 2 });
  const bs = s.getWorldBbox();
  ok(approx(bs.minX, 50) && approx(bs.maxX, 250), "scale2 world bbox X = [50,250]");
}

console.log("[5] group auto-center + nested hitTest");
{
  const g = new Group({});
  g.addChild(new Rectangle({ position: { x: 0, y: 0 }, width: 46, height: 46 }));
  g.addChild(new Rectangle({ position: { x: 56, y: 0 }, width: 46, height: 46 }));
  g.addChild(new Rectangle({ position: { x: 28, y: 52 }, width: 46, height: 46 }));
  g.updateAttrConfig({ position: { x: 100, y: 100 } });

  const c = g.getCenterPoint();
  ok(approx(c.x, 151) && approx(c.y, 149), "group center auto-computed from children");

  const hit = g.hitTest({ x: 100 + 10, y: 100 + 10 });
  ok(hit !== null && hit.getWidgetType() === "RECTANGLE", "group hitTest returns deepest leaf");
  ok(g.hitTest({ x: 100 + 10, y: 100 + 60 }) === null, "empty area inside group misses");
}

console.log("[6] R-Tree integration in CanvasLayer");
{
  const layer = new CanvasLayer();
  layer.addChild(new Rectangle({ position: { x: 0, y: 0 }, width: 50, height: 50 }));
  layer.addChild(new Rectangle({ position: { x: 500, y: 500 }, width: 50, height: 50 }));
  const found = layer.checkPointInWidget({ x: 20, y: 20 });
  ok(found !== null, "R-Tree found shape at (20,20)");
  ok(layer.checkPointInWidget({ x: 300, y: 300 }) === null, "no shape at empty area");
  ok(layer.checkPointInWidget({ x: 510, y: 510 }) !== null, "R-Tree found shape at (510,510)");
}

console.log("[7] events: stopPropagation + dragger");
{
  let order = [];
  const rect = new Rectangle({ position: { x: 0, y: 0 }, width: 50, height: 50 });
  rect.addEvent(CanvasWidgetEventTypeEnum.OnClick, (ev) => {
    order.push("first");
    ev.stopPropagation();
  });
  rect.addEvent(CanvasWidgetEventTypeEnum.OnClick, () => order.push("second"));
  rect.emitEvent(CanvasWidgetEventTypeEnum.OnClick, undefined, { x: 0, y: 0 });
  ok(order.length === 1 && order[0] === "first", "stopPropagation blocks second handler");

  const drag = new Dragger();
  const target = new Rectangle({ position: { x: 10, y: 10 }, width: 20, height: 20 });
  drag.linkTo(target);
  target.emitEvent(CanvasWidgetEventTypeEnum.PointerDown, undefined, { x: 10, y: 10 });
  target.emitEvent(CanvasWidgetEventTypeEnum.PointerMove, undefined, { x: 40, y: 30 });
  const p = target.getPosition();
  ok(approx(p.x, 40) && approx(p.y, 30), "dragger moved shape to pointer");
  drag.removeChild();
}

console.log("[8] transformer resize");
{
  const rect = new Rectangle({ position: { x: 100, y: 100 }, width: 100, height: 100 });
  const tr = new Transformer();
  tr.linkToChild(rect);
  tr.transformHandle(TransformTypeEnum.BottomRightResize, { x: 200, y: 200 });
  const sc = rect.getTransformConfig();
  ok(approx(sc.scaleX, 1) && approx(sc.scaleY, 1), "resize to same corner = no change");
  tr.transformHandle(TransformTypeEnum.BottomRightResize, { x: 250, y: 250 });
  ok(rect.getTransformConfig().scaleX > 1, "resize enlarges scaleX");
}

console.log("[9] levelUp / levelDown");
{
  const group = new Group({});
  const a = new Rectangle({ position: { x: 0, y: 0 }, width: 10, height: 10 });
  const b = new Rectangle({ position: { x: 0, y: 0 }, width: 10, height: 10 });
  const c = new Rectangle({ position: { x: 0, y: 0 }, width: 10, height: 10 });
  group.addChild(a, b, c);
  ok(group.getChildren()[2] === c, "initial order [a,b,c]");

  a.levelUp();
  ok(group.getChildren()[0] === b && group.getChildren()[1] === a, "a.levelUp -> [b,a,c]");
  a.levelDown();
  ok(group.getChildren()[0] === a && group.getChildren()[1] === b, "a.levelDown -> back to [a,b,c]");

  c.levelDown();
  ok(group.getChildren()[1] === c && group.getChildren()[2] === b, "c.levelDown -> [a,c,b]");
  c.levelUp();
  ok(group.getChildren()[2] === c, "c.levelUp -> back to [a,b,c]");

  c.levelUp(); // already top, no-op
  ok(group.getChildren()[2] === c && group.getChildren().length === 3, "levelUp at top is no-op");
  a.levelDown(); // already bottom, no-op
  ok(group.getChildren()[0] === a, "levelDown at bottom is no-op");
}

console.log("[10] Animation");
{
  let now = 0;
  let nextId = 1;
  const pending = new Map();
  globalThis.requestAnimationFrame = (cb) => { const id = nextId++; pending.set(id, cb); return id; };
  globalThis.cancelAnimationFrame = (id) => { pending.delete(id); };
  const step = (ms) => {
    now += ms;
    const cbs = [...pending.values()];
    pending.clear();
    for (const cb of cbs) cb(now);
  };

  const frames = [];
  const anim = new Animation((f) => frames.push(f.frameCount), { times: 3, delay: 0 });
  anim.start();
  ok(anim.isRunning() === true, "running after start");
  step(16);
  step(16);
  step(16);
  ok(frames.join(",") === "1,2,3", "three executions then stop");
  ok(anim.isRunning() === false, "auto-stopped after times reached");

  const delayed = [];
  const d = new Animation((f) => delayed.push(f.frameCount), { times: 2, delay: 100 });
  d.start();
  step(50);
  ok(delayed.length === 0, "delay: none before 100ms");
  step(60); // now = 110
  ok(delayed.length === 0, "delay: still none (first tick at 50, need 150)");
  step(50); // now = 160 -> first run
  ok(delayed.join(",") === "1", "delay: first run after interval");
  step(50); // now = 210
  step(50); // now = 260 -> second run, stop
  ok(delayed.join(",") === "1,2", "delay: second run and stop");

  const infinite = [];
  const forever = new Animation((f) => infinite.push(f.frameCount), { delay: 0 });
  forever.start();
  step(16);
  step(16);
  ok(infinite.length === 2, "infinite animation runs each frame");
  forever.stop();
  step(16);
  ok(infinite.length === 2, "stop() halts execution");
}

console.log(`\nRESULT: ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
