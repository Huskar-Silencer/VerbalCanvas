import { CanvasPainter } from "../core/CanvasPainter";
import {
  CanvasShapeWidget,
  CanvasShapeWidgetBaseAttrConfig,
} from "../core/CanvasShapeWidget";
import { CanvasWidgetTypeEnum } from "../core/CanvasWidget";

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
    if (newAttrConfig.width) this.width = newAttrConfig.width;
    if (newAttrConfig.height) this.height = newAttrConfig.height;
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
    const position = this.getPosition();
    painter.rect(position.x, position.y, this.width, this.height);
    if (styleConfig.fillStyle) painter.fill();
    if (styleConfig.strokeStyle) painter.stroke();
  }
}
