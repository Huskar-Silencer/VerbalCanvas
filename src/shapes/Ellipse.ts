import { CanvasShapeWidget } from "../core/CanvasShapeWidget";

class Ellipse extends CanvasShapeWidget {
  private rx: number = 0;
  private ry: number = 0;

  public override getWidgetType(): string {
    return "ELLIPSE";
  }
}
