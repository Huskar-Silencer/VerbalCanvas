const containerDom = document.getElementById(
  "canvas-container",
) as HTMLCanvasElement;

import { CanvasHolder } from "./core/CanvasHolder";
import { CanvasLayer } from "./core/CanvasLayer";
import { Rectangle, RectangleWidgetAttrConfig } from "./shapes/Rectangle";

const canvasHolder = new CanvasHolder({
  containerDom: containerDom,
  width: 1000,
  height: 1000,
});

const canvasLayer = new CanvasLayer();
canvasHolder.addChild(canvasLayer);

const rect = new Rectangle({
  position: { x: 100, y: 100 },
  width: 100,
  height: 100,
  style: {
    fillStyle: "blue",
  },
});

console.log(rect);

const config: RectangleWidgetAttrConfig = {
  width: 100,
  height: 200,
};

rect.updateAttrConfig(config);

canvasLayer.addChild(rect);
