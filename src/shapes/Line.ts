import { CanvasPainter } from "../core/CanvasPainter";
import {
  CanvasShapeWidget,
  CanvasShapeWidgetBaseAttrConfig,
} from "../core/CanvasShapeWidget";
import { Point } from "../other/Utils";

export interface LineAttrConfig extends CanvasShapeWidgetBaseAttrConfig {
  p1?: Point;
  p2?: Point;
}

class Line extends CanvasShapeWidget {
  private p1: Point = { x: 0, y: 0 };
  private p2: Point = { x: 0, y: 0 };

  constructor(config: LineAttrConfig) {
    super(config);
    if (config.p1) this.p1 = Object.assign({}, config.p1);
    if (config.p2) this.p2 = Object.assign({}, config.p2);
  }

  public getLinePoints(): Point[] {
    return [Object.assign({}, this.p1), Object.assign({}, this.p2)];
  }

  protected override subPaint(painter: CanvasPainter) {
    const styleConfig = this.getStyleConfig();
    if (!styleConfig.strokeStyle) return;
    painter.beginPath();
    painter.moveTo(this.p1.x, this.p1.y);
    painter.lineTo(this.p2.x, this.p2.y);
    painter.stroke();
  }

  protected override subUpdateAttr<T extends LineAttrConfig>(newAttrConfig: T) {
    if (newAttrConfig.p1) this.p1 = Object.assign({}, newAttrConfig.p1);
    if (newAttrConfig.p2) this.p2 = Object.assign({}, newAttrConfig.p2);
  }
}
