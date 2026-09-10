import { CanvasPainter } from "../core/CanvasPainter";
import {
  CanvasShapeWidget,
  CanvasShapeWidgetBaseAttrConfig,
} from "../core/CanvasShapeWidget";
import { CanvasWidgetTypeEnum } from "../core/CanvasWidget";
import { Point } from "../other/Utils";

export interface RectangleWidgetAttrConfig extends CanvasShapeWidgetBaseAttrConfig {
  width?: number;
  height?: number;
}

export class Rectangle extends CanvasShapeWidget {
  private width: number = 0;
  private height: number = 0;

  constructor(config: RectangleWidgetAttrConfig) {
    super(config);
    this.width = config.width ?? 0;
    this.height = config.height ?? 0;
    this.calculateCenterPoint();
    this.calculateBboxConfig();
  }

  protected override subUpdateAttr<T extends RectangleWidgetAttrConfig>(
    newAttrConfig: T,
  ) {
    super.subUpdateAttr(newAttrConfig);
    if (newAttrConfig.width !== undefined) this.width = newAttrConfig.width;
    if (newAttrConfig.height !== undefined) this.height = newAttrConfig.height;
    if (newAttrConfig.width !== undefined || newAttrConfig.height !== undefined) {
      this.calculateCenterPoint();
      this.calculateBboxConfig();
    }
  }

  public override getWidgetType(): string {
    return CanvasWidgetTypeEnum.Rectangle;
  }

  protected override calculateCenterPoint() {
    const position = this.getPosition();
    this.setCenterPoint({
      x: position.x + this.width / 2,
      y: position.y + this.height / 2,
    });
  }

  protected override calculateBboxConfig() {
    const position = this.getPosition();
    this.setBboxConfig({
      x: position.x,
      y: position.y,
      width: this.width,
      height: this.height,
    });
  }

  protected override subPaint(painter: CanvasPainter) {
    const styleConfig = this.getStyleConfig();
    if (!styleConfig.fillStyle && !styleConfig.strokeStyle) return;
    painter.beginPath();
    painter.rect(0, 0, this.width, this.height);
    if (styleConfig.fillStyle) painter.fill();
    if (styleConfig.strokeStyle) painter.stroke();
  }

  protected override getRawLocalBboxVertexList(): Point[] {
    return [
      { x: 0, y: 0 },
      { x: this.width, y: 0 },
      { x: this.width, y: this.height },
      { x: 0, y: this.height },
    ];
  }

  protected override subIsPointInShape(point: Point): boolean {
    return (
      point.x >= 0 &&
      point.x <= this.width &&
      point.y >= 0 &&
      point.y <= this.height
    );
  }
}
