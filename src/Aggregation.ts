import { Rectangle } from "./shapes/Rectangle";
import { Ellipse } from "./shapes/Ellipse";
import { Line } from "./shapes/Line";
import { CustomShape } from "./shapes/CustomShape";
import { Group } from "./core/Group";
import { CanvasHolder } from "./core/CanvasHolder";
import { CanvasLayer } from "./core/CanvasLayer";
import { Dragger } from "./other/Dragger";
import { Transformer } from "./other/Transformer";
import { Animation } from "./other/Animation";

export const VerbalCanvas = {
  Rectangle,
  Ellipse,
  Line,
  CustomShape,
  Group,
  CanvasHolder,
  CanvasLayer,
  Dragger,
  Transformer,
  Animation,
} as const;
