import {
  rectBoxConfig2RectBoxVertexList,
  unionRectBoxVertexList,
  rectBoxVertexList2RectBoxConfig,
} from "../other/Utils";
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
    for (const child of children) child.place2Parent(this);
    this.emitEvent(CanvasWidgetEventTypeEnum.OnChange);
  }

  public removeChild(...children: ChildType[]) {
    for (const child of children) child.remove();
    this.emitEvent(CanvasWidgetEventTypeEnum.OnChange);
  }

  public getSize() {
    return this.children.length;
  }

  protected override subPaint(painter: CanvasPainter) {
    for (const child of this.children) child.paint(painter);
  }

  protected override subUpdateAttr<
    T extends CanvasContainerWidgetBaseAttrConfig,
  >(newAttrConfig: T) {
    if (newAttrConfig.width) this.width = newAttrConfig.width;
    if (newAttrConfig.height) this.height = newAttrConfig.height;
  }

  protected calOverallWidthAndHeight(...children: ChildType[]) {
    let groupRectBoxVertexList = this.getBboxVertexList();
    for (const child of children) {
      const childBboxVertexList = child.getClientBboxVertexList();
      groupRectBoxVertexList = rectBoxConfig2RectBoxVertexList(
        unionRectBoxVertexList(groupRectBoxVertexList, childBboxVertexList),
      );
    }
    const rectBoxConfig = rectBoxVertexList2RectBoxConfig(
      groupRectBoxVertexList,
    );
  }

  private calRelativePosition(...children: ChildType[]) {
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

  private restoreRelativePosition(child: ChildType) {
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
