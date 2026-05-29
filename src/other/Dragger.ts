import {
  CanvasWidget,
  CanvasWidgetEvent,
  CanvasWidgetEventTypeEnum,
} from "../core/CanvasWidget";
import { DeltaValue } from "./Utils";

class Dragger {
  private child: CanvasWidget | null = null;

  private deltaValue: DeltaValue = { deltaX: 0, deltaY: 0 };

  private isCatching: boolean = false;

  public linkTo(widget: CanvasWidget) {
    if (this.child) this.removeChild();
    widget.addEvent(
      CanvasWidgetEventTypeEnum.PointerDown,
      this.mouseDownHandler,
    );
    widget.addEvent(
      CanvasWidgetEventTypeEnum.PointerMove,
      this.mouseMoveHandler,
    );
    widget.addEvent(CanvasWidgetEventTypeEnum.PointerUp, this.mouseUpHandler);
    this.child = widget;
  }

  public removeChild() {
    if (!this.child) return;
    this.child.removeEvent(
      CanvasWidgetEventTypeEnum.PointerDown,
      this.mouseDownHandler,
    );
    this.child.removeEvent(
      CanvasWidgetEventTypeEnum.PointerMove,
      this.mouseMoveHandler,
    );
    this.child.removeEvent(
      CanvasWidgetEventTypeEnum.PointerUp,
      this.mouseUpHandler,
    );
    this.child = null;
    this.deltaValue.deltaX = 0;
    this.deltaValue.deltaY = 0;
    this.isCatching = false;
  }

  private mouseDownHandler(canvasWidgetEvent: CanvasWidgetEvent) {
    if (!this.child || !canvasWidgetEvent.nativeEvent) return;
    this.isCatching = true;
    const triggerPoint = {
      x: canvasWidgetEvent.nativeEvent.offsetX,
      y: canvasWidgetEvent.nativeEvent.offsetY,
    };
    const position = this.child.getPosition();
    this.deltaValue.deltaX = triggerPoint.x - position.x;
    this.deltaValue.deltaY = triggerPoint.y - position.y;
  }

  private mouseMoveHandler(canvasWidgetEvent: CanvasWidgetEvent) {
    if (!this.child || !this.isCatching) return;
    this.followTriggerPoint(canvasWidgetEvent);
  }

  private mouseUpHandler(canvasWidgetEvent: CanvasWidgetEvent) {
    if (!this.child || !this.isCatching) return;
    this.isCatching = false;
    this.followTriggerPoint(canvasWidgetEvent);
  }

  private followTriggerPoint(canvasWidgetEvent: CanvasWidgetEvent) {
    if (!this.child || !canvasWidgetEvent.nativeEvent) return;
    const triggerPoint = {
      x: canvasWidgetEvent.nativeEvent.offsetX,
      y: canvasWidgetEvent.nativeEvent.offsetY,
    };
    this.child.updateAttrConfig({
      position: {
        x: triggerPoint.x - this.deltaValue.deltaX,
        y: triggerPoint.y - this.deltaValue.deltaY,
      },
    });
  }
}
