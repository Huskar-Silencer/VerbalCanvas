import { CanvasContainerWidget } from "./CanvasContainerWidget";
import { CanvasWidgetTypeEnum } from "./CanvasWidget";

export class Group extends CanvasContainerWidget {
  public override getWidgetType() {
    return CanvasWidgetTypeEnum.Group;
  }
}
