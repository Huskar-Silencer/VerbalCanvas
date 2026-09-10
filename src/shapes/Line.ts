import { CanvasPainter } from "../core/CanvasPainter";
import {
  CanvasShapeWidget,
  CanvasShapeWidgetBaseAttrConfig,
} from "../core/CanvasShapeWidget";
import { CanvasWidgetTypeEnum } from "../core/CanvasWidget";
import { calLineMidPoint, distancePointToSegment, Point } from "../other/Utils";

export interface LineAttrConfig extends CanvasShapeWidgetBaseAttrConfig {
  p1?: Point;
  p2?: Point;
}

export class Line extends CanvasShapeWidget {
  private p1: Point = { x: 0, y: 0 };
  private p2: Point = { x: 0, y: 0 };

  constructor(config: LineAttrConfig) {
    super(config);
    if (config.p1) this.p1 = Object.assign({}, config.p1);
    if (config.p2) this.p2 = Object.assign({}, config.p2);
    this.calculateCenterPoint();
    this.calculateBboxConfig();
  }

  protected override calculateCenterPoint() {
    this.setCenterPoint(calLineMidPoint(this.p1, this.p2));
  }

  protected override calculateBboxConfig() {
    this.setBboxConfig({
      x: Math.min(this.p1.x, this.p2.x),
      y: Math.min(this.p1.y, this.p2.y),
      width: Math.abs(this.p1.x - this.p2.x),
      height: Math.abs(this.p1.y - this.p2.y),
    });
  }

  public getLinePoints(): Point[] {
    return [Object.assign({}, this.p1), Object.assign({}, this.p2)];
  }

  public override getWidgetType() {
    return CanvasWidgetTypeEnum.Line;
  }

  protected override subPaint(painter: CanvasPainter) {
    const styleConfig = this.getStyleConfig();
    if (!styleConfig.strokeStyle) return;
    painter.beginPath();
    painter.moveTo(this.p1.x, this.p1.y);
    painter.lineTo(this.p2.x, this.p2.y);
    painter.stroke();
  }

  protected override getRawLocalBboxVertexList(): Point[] {
    return [Object.assign({}, this.p1), Object.assign({}, this.p2)];
  }

  protected override subIsPointInShape(point: Point): boolean {
    const tolerance = Math.max((this.getStyleConfig().lineWidth ?? 0) / 2, 4);
    return distancePointToSegment(point, this.p1, this.p2) <= tolerance;
  }

  protected override subUpdateAttr<T extends LineAttrConfig>(newAttrConfig: T) {
    if (newAttrConfig.p1 !== undefined) this.p1 = Object.assign({}, newAttrConfig.p1);
    if (newAttrConfig.p2 !== undefined) this.p2 = Object.assign({}, newAttrConfig.p2);
    if (newAttrConfig.p1 !== undefined || newAttrConfig.p2 !== undefined) {
      this.calculateCenterPoint();
      this.calculateBboxConfig();
    }
  }
}
