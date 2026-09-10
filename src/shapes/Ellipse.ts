import { CanvasPainter } from "../core/CanvasPainter";
import {
  CanvasShapeWidget,
  CanvasShapeWidgetBaseAttrConfig,
} from "../core/CanvasShapeWidget";
import { CanvasWidgetTypeEnum } from "../core/CanvasWidget";
import { Point } from "../other/Utils";

export interface EllipseAttrConfig extends CanvasShapeWidgetBaseAttrConfig {
  rx?: number;
  ry?: number;
}

export class Ellipse extends CanvasShapeWidget {
  private rx: number = 0;
  private ry: number = 0;

  constructor(config: EllipseAttrConfig) {
    super(config);
    this.rx = config.rx ?? 0;
    this.ry = config.ry ?? 0;
    this.calculateCenterPoint();
    this.calculateBboxConfig();
  }

  protected override calculateCenterPoint() {
    const position = this.getPosition();
    this.setCenterPoint({
      x: position.x + this.rx,
      y: position.y + this.ry,
    });
  }

  protected override calculateBboxConfig() {
    const position = this.getPosition();
    this.setBboxConfig({
      x: position.x,
      y: position.y,
      width: this.rx * 2,
      height: this.ry * 2,
    });
  }

  public override getWidgetType() {
    return CanvasWidgetTypeEnum.Ellipse;
  }

  protected override subUpdateAttr<T extends EllipseAttrConfig>(
    newAttrConfig: T,
  ) {
    if (newAttrConfig.rx !== undefined) this.rx = newAttrConfig.rx;
    if (newAttrConfig.ry !== undefined) this.ry = newAttrConfig.ry;
    if (newAttrConfig.rx !== undefined || newAttrConfig.ry !== undefined) {
      this.calculateCenterPoint();
      this.calculateBboxConfig();
    }
  }

  protected override subPaint(painter: CanvasPainter) {
    const styleConfig = this.getStyleConfig();
    if (!styleConfig.fillStyle && !styleConfig.strokeStyle) return;
    painter.beginPath();
    painter.ellipse(
      this.rx,
      this.ry,
      this.rx,
      this.ry,
      0,
      0,
      Math.PI * 2,
    );
    if (styleConfig.fillStyle) painter.fill();
    if (styleConfig.strokeStyle) painter.stroke();
  }

  protected override getRawLocalBboxVertexList(): Point[] {
    const width = this.rx * 2;
    const height = this.ry * 2;
    return [
      { x: 0, y: 0 },
      { x: width, y: 0 },
      { x: width, y: height },
      { x: 0, y: height },
    ];
  }

  protected override subIsPointInShape(point: Point): boolean {
    if (this.rx <= 0 || this.ry <= 0) return false;
    const dx = (point.x - this.rx) / this.rx;
    const dy = (point.y - this.ry) / this.ry;
    return dx * dx + dy * dy <= 1;
  }
}
