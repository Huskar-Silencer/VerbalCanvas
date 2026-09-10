import { CanvasHolder } from "./core/CanvasHolder";
import { CanvasLayer } from "./core/CanvasLayer";
import { CanvasWidgetEventTypeEnum } from "./core/CanvasWidget";
import { Group } from "./core/Group";
import { Dragger } from "./other/Dragger";
import { Ellipse } from "./shapes/Ellipse";
import { Line } from "./shapes/Line";
import { Rectangle } from "./shapes/Rectangle";
import { CustomShape } from "./shapes/CustomShape";

const containerDom = document.getElementById(
  "canvas-container",
) as HTMLElement;

const width = window.innerWidth;
const height = window.innerHeight;

const canvasHolder = new CanvasHolder({
  containerDom,
  width,
  height,
});

const canvasLayer = new CanvasLayer();
canvasHolder.addChild(canvasLayer);
canvasHolder.enableEvent();

canvasLayer.addChild(
  new Rectangle({
    position: { x: 0, y: 0 },
    width,
    height,
    style: { fillStyle: "#f4f4f5" },
  }),
);

const rect = new Rectangle({
  position: { x: 180, y: 140 },
  width: 180,
  height: 120,
  rotation: 15,
  style: { fillStyle: "#3b82f6", strokeStyle: "#1d4ed8", lineWidth: 2 },
});
canvasLayer.addChild(rect);

const dragger = new Dragger();
dragger.linkTo(rect);

rect.addEvent(CanvasWidgetEventTypeEnum.Hover, () => {
  rect.updateAttrConfig({ style: { strokeStyle: "#f59e0b", lineWidth: 4 } });
});
rect.addEvent(CanvasWidgetEventTypeEnum.HoverOut, () => {
  rect.updateAttrConfig({ style: { strokeStyle: "#1d4ed8", lineWidth: 2 } });
});

const ellipse = new Ellipse({
  position: { x: 460, y: 120 },
  rx: 80,
  ry: 60,
  style: { fillStyle: "#f59e0b" },
});
canvasLayer.addChild(ellipse);

const colors = ["#f59e0b", "#10b981", "#8b5cf6", "#ef4444"];
let colorIndex = 0;
ellipse.addEvent(CanvasWidgetEventTypeEnum.OnClick, () => {
  colorIndex = (colorIndex + 1) % colors.length;
  ellipse.updateAttrConfig({ style: { fillStyle: colors[colorIndex] } });
});

canvasLayer.addChild(
  new Rectangle({
    position: { x: 660, y: 180 },
    width: 90,
    height: 90,
    scaleX: 1.4,
    scaleY: 1.4,
    style: { fillStyle: "#10b981" },
  }),
);

canvasLayer.addChild(
  new Line({
    p1: { x: 200, y: 420 },
    p2: { x: 520, y: 340 },
    style: { strokeStyle: "#ef4444", lineWidth: 4 },
  }),
);

canvasLayer.addChild(
  new CustomShape({
    position: { x: 300, y: 320 },
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
  }),
);

const group = new Group({});
group.addChild(
  new Rectangle({
    position: { x: 0, y: 0 },
    width: 46,
    height: 46,
    style: { fillStyle: "#8b5cf6" },
  }),
  new Rectangle({
    position: { x: 56, y: 0 },
    width: 46,
    height: 46,
    style: { fillStyle: "#7c3aed" },
  }),
  new Rectangle({
    position: { x: 28, y: 52 },
    width: 46,
    height: 46,
    style: { fillStyle: "#6d28d9" },
  }),
);
group.updateAttrConfig({ position: { x: 620, y: 400 }, rotation: -15 });
canvasLayer.addChild(group);
