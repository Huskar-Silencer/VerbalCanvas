import { CanvasPainter } from "../core/CanvasPainter";
import {
  CanvasShapeWidget,
  CanvasShapeWidgetBaseAttrConfig,
} from "../core/CanvasShapeWidget";
import { CanvasWidgetTypeEnum } from "../core/CanvasWidget";
import { Point } from "../other/Utils";

export type customPaintFnType = (ctx: CanvasRenderingContext2D) => void;

export type customHitTestFnType = (point: Point) => boolean;

export interface CustomShapeAttrConfig extends CanvasShapeWidgetBaseAttrConfig {
  width?: number;
  height?: number;
  customPaintFn?: customPaintFnType;
  hitTestFn?: customHitTestFnType;
}

export class CustomShape extends CanvasShapeWidget {
  private width: number = 0;
  private height: number = 0;
  private customPaintFn: customPaintFnType;
  private hitTestFn?: customHitTestFnType;

  constructor(config: CustomShapeAttrConfig) {
    super(config);
    this.width = config.width ?? 0;
    this.height = config.height ?? 0;
    this.customPaintFn = config.customPaintFn ?? (() => {});
    this.hitTestFn = config.hitTestFn;
    this.calculateCenterPoint();
    this.calculateBboxConfig();
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

  public override getWidgetType() {
    return CanvasWidgetTypeEnum.CustomShape;
  }

  protected override subPaint(painter: CanvasPainter) {
    this.customPaintFn(painter.getContext());
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
    if (this.hitTestFn) return this.hitTestFn(point);
    return (
      point.x >= 0 &&
      point.x <= this.width &&
      point.y >= 0 &&
      point.y <= this.height
    );
  }

  protected override subUpdateAttr<T extends CanvasShapeWidgetBaseAttrConfig>(
    newAttrConfig: T,
  ) {
    const cfg = newAttrConfig as Partial<CustomShapeAttrConfig>;
    if (cfg.width !== undefined) this.width = cfg.width;
    if (cfg.height !== undefined) this.height = cfg.height;
    if (cfg.width !== undefined || cfg.height !== undefined) {
      this.calculateCenterPoint();
      this.calculateBboxConfig();
    }
  }
}
