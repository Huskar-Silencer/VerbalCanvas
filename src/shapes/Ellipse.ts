import { CanvasPainter } from "../core/CanvasPainter";
import {
  CanvasShapeWidget,
  CanvasShapeWidgetBaseAttrConfig,
} from "../core/CanvasShapeWidget";
import { CanvasWidgetTypeEnum } from "../core/CanvasWidget";

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
      x: position.x + this.rx / 2,
      y: position.y + this.ry / 2,
    });
  }

  protected override calculateBboxConfig() {
    const position = this.getPosition();
    this.setBboxConfig({
      x: position.x,
      y: position.y,
      width: this.rx,
      height: this.ry,
    });
  }

  public override getWidgetType() {
    return CanvasWidgetTypeEnum.Ellipse;
  }

  protected override subPaint(painter: CanvasPainter) {
    const styleConfig = this.getStyleConfig();
    if (!styleConfig.fillStyle && !styleConfig.strokeStyle) return;
    const centerPoint = this.getCenterPoint();
    painter.beginPath();
    painter.ellipse(
      centerPoint.x,
      centerPoint.y,
      this.rx,
      this.ry,
      0,
      0,
      Math.PI * 2,
    );
    if (styleConfig.fillStyle) painter.fill();
    if (styleConfig.strokeStyle) painter.stroke();
  }
}
