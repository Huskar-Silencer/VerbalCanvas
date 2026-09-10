import { rectBoxVertexList2RectBoxConfig, Point } from "../other/Utils";
import { CanvasPainter } from "./CanvasPainter";
import {
  CanvasWidget,
  CanvasWidgetBaseAttrConfig,
  CanvasWidgetEventTypeEnum,
} from "./CanvasWidget";

export interface CanvasContainerWidgetBaseAttrConfig extends CanvasWidgetBaseAttrConfig {
  width?: number;
  height?: number;
}

export abstract class CanvasContainerWidget<
  ChildType extends CanvasWidget = CanvasWidget,
> extends CanvasWidget {
  private width: number = 0;

  private height: number = 0;

  private children: ChildType[] = [];

  private onChildGeometryChange = () => {
    this.updateSelfCenterPoint();
  };

  constructor(config: CanvasContainerWidgetBaseAttrConfig) {
    super(config);
    this.width = config.width ?? 0;
    this.height = config.height ?? 0;
  }

  public getWidth() {
    return this.width;
  }

  public getHeight() {
    return this.height;
  }

  public getChildren() {
    return this.children;
  }

  public addChild(...children: ChildType[]) {
    for (const child of children) {
      child.place2Parent(this);
      child.addEvent(
        CanvasWidgetEventTypeEnum.OnChange,
        this.onChildGeometryChange,
      );
    }
    this.updateSelfCenterPoint();
    this.emitEvent(CanvasWidgetEventTypeEnum.OnChange);
  }

  public removeChild(...children: ChildType[]) {
    for (const child of children) {
      child.removeEvent(
        CanvasWidgetEventTypeEnum.OnChange,
        this.onChildGeometryChange,
      );
      child.remove();
    }
    this.updateSelfCenterPoint();
    this.emitEvent(CanvasWidgetEventTypeEnum.OnChange);
  }

  public getSize() {
    return this.children.length;
  }

  // Auto-update the center point (rotation/scale anchor) and self bbox from children
  protected updateSelfCenterPoint() {
    const vertices: Point[] = [];
    for (const child of this.children) {
      vertices.push(...child.getClientBboxVertexList());
    }
    if (vertices.length === 0) return;
    const rect = rectBoxVertexList2RectBoxConfig(vertices);
    const position = this.getPosition();
    this.setCenterPoint({
      x: position.x + rect.x + rect.width / 2,
      y: position.y + rect.y + rect.height / 2,
    });
    this.setBboxConfig({
      x: position.x + rect.x,
      y: position.y + rect.y,
      width: rect.width,
      height: rect.height,
    });
    this.invalidateWorldBbox();
  }

  protected override subPaint(painter: CanvasPainter) {
    for (const child of this.children) child.paint(painter);
  }

  protected override subIsPointInShape(point: Point): boolean {
    for (let i = this.children.length - 1; i >= 0; i--) {
      if (this.children[i].isPointInShape(point)) return true;
    }
    return false;
  }

  protected override subHitTest(point: Point): CanvasWidget | null {
    for (let i = this.children.length - 1; i >= 0; i--) {
      const hit = this.children[i].hitTest(point);
      if (hit) return hit;
    }
    return null;
  }

  protected override getLocalBboxVertexList(): Point[] {
    const vertices: Point[] = [];
    for (const child of this.children) {
      const bbox = child.getWorldBbox();
      vertices.push(
        { x: bbox.minX, y: bbox.minY },
        { x: bbox.maxX, y: bbox.minY },
        { x: bbox.maxX, y: bbox.maxY },
        { x: bbox.minX, y: bbox.maxY },
      );
    }
    return vertices;
  }

  protected override subUpdateAttr<
    T extends CanvasContainerWidgetBaseAttrConfig,
  >(newAttrConfig: T) {
    if (newAttrConfig.width !== undefined) this.width = newAttrConfig.width;
    if (newAttrConfig.height !== undefined) this.height = newAttrConfig.height;
  }

  protected calOverallWidthAndHeight(...children: ChildType[]) {
    if (children.length === 0) return;
    const vertices: Point[] = [];
    for (const child of children) {
      vertices.push(...child.getClientBboxVertexList());
    }
    const rectBoxConfig = rectBoxVertexList2RectBoxConfig(vertices);
    const newAttrConfig: CanvasContainerWidgetBaseAttrConfig = {
      position: { x: rectBoxConfig.x, y: rectBoxConfig.y },
      width: rectBoxConfig.width,
      height: rectBoxConfig.height,
    };
    this.updateAttrConfig(newAttrConfig);
  }

  protected calRelativePosition(...children: ChildType[]) {
    const groupPosition = this.getPosition();
    for (const child of children) {
      const childPosition = child.getPosition();
      const deltaValue = {
        deltaX: childPosition.x - groupPosition.x,
        deltaY: childPosition.y - groupPosition.y,
      };
      child.updateAttrConfig({
        position: { x: deltaValue.deltaX, y: deltaValue.deltaY },
      });
    }
  }

  protected restoreRelativePosition(child: ChildType) {
    const groupPosition = this.getPosition();
    const relativePosition = child.getPosition();
    child.updateAttrConfig({
      position: {
        x: relativePosition.x + groupPosition.x,
        y: relativePosition.y + groupPosition.y,
      },
    });
  }
}
