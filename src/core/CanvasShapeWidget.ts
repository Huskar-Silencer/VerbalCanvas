import { CanvasWidgetStyleConfig, Point } from "../other/Utils";
import { CanvasWidget, CanvasWidgetBaseAttrConfig } from "./CanvasWidget";

export interface CanvasShapeWidgetBaseAttrConfig extends CanvasWidgetBaseAttrConfig {
  style?: CanvasWidgetStyleConfig;
}

export abstract class CanvasShapeWidget extends CanvasWidget {
  constructor(config: CanvasShapeWidgetBaseAttrConfig) {
    super(config);
  }

  protected abstract getRawLocalBboxVertexList(): Point[];

  protected getLocalBboxVertexList(): Point[] {
    const raw = this.getRawLocalBboxVertexList();
    if (raw.length === 0) return [];
    const lineWidth = this.getStyleConfig().lineWidth ?? 0;
    const halfLineWidth = lineWidth / 2;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const vertex of raw) {
      minX = Math.min(minX, vertex.x);
      minY = Math.min(minY, vertex.y);
      maxX = Math.max(maxX, vertex.x);
      maxY = Math.max(maxY, vertex.y);
    }
    return [
      { x: minX - halfLineWidth, y: minY - halfLineWidth },
      { x: maxX + halfLineWidth, y: minY - halfLineWidth },
      { x: maxX + halfLineWidth, y: maxY + halfLineWidth },
      { x: minX - halfLineWidth, y: maxY + halfLineWidth },
    ];
  }
}
