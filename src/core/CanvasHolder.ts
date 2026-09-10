import { CanvasContainerWidget } from "./CanvasContainerWidget";
import { CanvasLayer } from "./CanvasLayer";
import { CanvasWidget, CanvasWidgetEventTypeEnum } from "./CanvasWidget";
import { Point } from "../other/Utils";

export interface CanvasHolderConfig {
  containerDom: HTMLElement;
  width: number;
  height: number;
}

export class CanvasHolder extends CanvasContainerWidget<CanvasLayer> {
  private containerDom: HTMLElement;

  private eventDispatcher: EventDispatcher;

  private holderWidth: number;

  private holderHeight: number;

  private hoveredWidget: CanvasWidget | null = null;

  private pressedWidget: CanvasWidget | null = null;

  private pressedLayer: CanvasLayer | null = null;

  constructor(config: CanvasHolderConfig) {
    super({});
    this.containerDom = config.containerDom;
    this.holderWidth = config.width;
    this.holderHeight = config.height;
    this.eventDispatcher = new EventDispatcher(
      this.containerDom,
      this.handlePointerEvent,
    );
    this.initContainerDomStyle(config);
  }

  private initContainerDomStyle(config: CanvasHolderConfig) {
    this.containerDom.style.width = `${config.width}px`;
    this.containerDom.style.height = `${config.height}px`;
    this.containerDom.style.position = "relative";
    this.containerDom.style.overflow = "hidden";
  }

  private handlePointerEvent = (
    eventType: CanvasWidgetEventTypeEnum,
    point: Point,
    nativeEvent: PointerEvent,
  ) => {
    const layers = this.getChildren();
    let target: CanvasWidget | null = null;
    let targetPoint: Point | null = null;
    let targetLayer: CanvasLayer | null = null;
    for (let i = layers.length - 1; i >= 0; i--) {
      const layer = layers[i];
      const worldPoint = layer.screenPointToWorldPoint(point);
      target = layer.checkPointInWidget(worldPoint);
      if (target) {
        targetPoint = worldPoint;
        targetLayer = layer;
        break;
      }
    }

    if (eventType === CanvasWidgetEventTypeEnum.PointerMove) {
      if (target !== this.hoveredWidget) {
        const prev = this.hoveredWidget;
        this.hoveredWidget = target;
        if (prev)
          prev.emitEvent(CanvasWidgetEventTypeEnum.HoverOut, nativeEvent);
        if (target)
          target.emitEvent(
            CanvasWidgetEventTypeEnum.Hover,
            nativeEvent,
            targetPoint ?? undefined,
          );
      }
      const moveTarget = this.pressedWidget ?? target;
      const movePoint =
        this.pressedLayer && this.pressedWidget
          ? this.pressedLayer.screenPointToWorldPoint(point)
          : (targetPoint ?? undefined);
      if (moveTarget)
        moveTarget.emitEvent(
          CanvasWidgetEventTypeEnum.PointerMove,
          nativeEvent,
          movePoint,
        );
    } else if (eventType === CanvasWidgetEventTypeEnum.PointerDown) {
      this.pressedWidget = target;
      this.pressedLayer = target ? targetLayer : null;
      if (target)
        target.emitEvent(
          CanvasWidgetEventTypeEnum.PointerDown,
          nativeEvent,
          targetPoint ?? undefined,
        );
    } else if (eventType === CanvasWidgetEventTypeEnum.PointerUp) {
      if (target && target === this.pressedWidget)
        target.emitEvent(
          CanvasWidgetEventTypeEnum.OnClick,
          nativeEvent,
          targetPoint ?? undefined,
        );
      const upTarget = this.pressedWidget ?? target;
      const upPoint =
        this.pressedLayer && this.pressedWidget
          ? this.pressedLayer.screenPointToWorldPoint(point)
          : (targetPoint ?? undefined);
      if (upTarget)
        upTarget.emitEvent(
          CanvasWidgetEventTypeEnum.PointerUp,
          nativeEvent,
          upPoint,
        );
      this.pressedWidget = null;
      this.pressedLayer = null;
    }
  };

  public override addChild(...children: CanvasLayer[]) {
    for (const child of children) {
      child.place2Parent(this);
      this.containerDom.appendChild(child.getCanvasDom());
      child.setCanvasSize(this.getWidth(), this.getHeight());
    }
  }

  public override removeChild(...children: CanvasLayer[]) {
    for (const child of children) {
      child.remove();
      child.getCanvasDom().remove();
    }
  }

  public getWidth() {
    return this.holderWidth;
  }

  public getHeight() {
    return this.holderHeight;
  }

  public setContainerSize(width: number, height: number) {
    this.holderWidth = width;
    this.holderHeight = height;
    this.containerDom.style.width = `${width}px`;
    this.containerDom.style.height = `${height}px`;
    const children = this.getChildren() as CanvasLayer[];
    for (const layer of children)
      layer.setCanvasSize(this.holderWidth, this.holderHeight);
  }

  public enableEvent() {
    this.eventDispatcher.bindEventHandler();
  }

  public cancelEvent() {
    this.eventDispatcher.unbindEventHandler();
  }
}

class EventDispatcher {
  private eventDom: HTMLElement;

  private onPointerEvent: (
    eventType: CanvasWidgetEventTypeEnum,
    point: Point,
    nativeEvent: PointerEvent,
  ) => void;

  private domRect: DOMRect | null = null;

  constructor(
    eventDom: HTMLElement,
    onPointerEvent: (
      eventType: CanvasWidgetEventTypeEnum,
      point: Point,
      nativeEvent: PointerEvent,
    ) => void,
  ) {
    this.eventDom = eventDom;
    this.onPointerEvent = onPointerEvent;
  }

  private refreshRect = () => {
    this.domRect = null;
  };

  private getPoint(event: PointerEvent): Point {
    if (!this.domRect) this.domRect = this.eventDom.getBoundingClientRect();
    return {
      x: event.clientX - this.domRect.left,
      y: event.clientY - this.domRect.top,
    };
  }

  public bindEventHandler() {
    if (!this.eventDom) return;
    this.refreshRect();
    window.addEventListener("resize", this.refreshRect);
    document.addEventListener("scroll", this.refreshRect, true);
    this.eventDom.addEventListener(
      CanvasWidgetEventTypeEnum.PointerMove,
      this.mouseMoveHandler,
    );
    this.eventDom.addEventListener(
      CanvasWidgetEventTypeEnum.PointerDown,
      this.mouseDownHandler,
    );
    this.eventDom.addEventListener(
      CanvasWidgetEventTypeEnum.PointerUp,
      this.mouseUpHandler,
    );
  }

  public unbindEventHandler() {
    if (!this.eventDom) return;
    window.removeEventListener("resize", this.refreshRect);
    document.removeEventListener("scroll", this.refreshRect, true);
    this.domRect = null;
    this.eventDom.removeEventListener(
      CanvasWidgetEventTypeEnum.PointerMove,
      this.mouseMoveHandler,
    );
    this.eventDom.removeEventListener(
      CanvasWidgetEventTypeEnum.PointerDown,
      this.mouseDownHandler,
    );
    this.eventDom.removeEventListener(
      CanvasWidgetEventTypeEnum.PointerUp,
      this.mouseUpHandler,
    );
  }

  private mouseMoveHandler = (event: PointerEvent) => {
    this.onPointerEvent(
      CanvasWidgetEventTypeEnum.PointerMove,
      this.getPoint(event),
      event,
    );
  };

  private mouseDownHandler = (event: PointerEvent) => {
    this.onPointerEvent(
      CanvasWidgetEventTypeEnum.PointerDown,
      this.getPoint(event),
      event,
    );
  };

  private mouseUpHandler = (event: PointerEvent) => {
    this.onPointerEvent(
      CanvasWidgetEventTypeEnum.PointerUp,
      this.getPoint(event),
      event,
    );
  };
}
