import { CanvasWidgetStyleConfig, Point } from "../other/Utils";
import { CanvasWidget, CanvasWidgetBaseAttrConfig } from "./CanvasWidget";

export interface CanvasShapeWidgetBaseAttrConfig extends CanvasWidgetBaseAttrConfig {
  style?: CanvasWidgetStyleConfig;
}

export abstract class CanvasShapeWidget extends CanvasWidget {
  constructor(config: CanvasShapeWidgetBaseAttrConfig) {
    super(config);
  }

  public getClientBboxVertexList(): Point[] {
    const styleConfig = this.getStyleConfig();
    if (!styleConfig.strokeStyle) return this.getBboxVertexList();
    const halfLineWidth = styleConfig.lineWidth ?? 1;
    const bBoxConfig = this.getBboxConfig();
    const maxX = bBoxConfig.x + bBoxConfig.width;
    const maxY = bBoxConfig.y + bBoxConfig.height;
    return [
      { x: bBoxConfig.x - halfLineWidth, y: bBoxConfig.y - halfLineWidth },
      { x: maxX + halfLineWidth, y: maxY - halfLineWidth },
      { x: maxX + halfLineWidth, y: maxY + halfLineWidth },
      { x: maxX - halfLineWidth, y: maxY + halfLineWidth },
    ];
  }
}
