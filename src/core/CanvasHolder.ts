import { CanvasContainerWidget } from "./CanvasContainerWidget";
import { CanvasLayer } from "./CanvasLayer";
import { CanvasWidgetEventTypeEnum } from "./CanvasWidget";

export interface CanvasHolderConfig {
  containerDom: HTMLElement;
  width: number;
  height: number;
}

export class CanvasHolder extends CanvasContainerWidget<CanvasLayer> {
  private containerDom: HTMLElement;

  private eventDispatcher: EventDispatcher;

  constructor(config: CanvasHolderConfig) {
    super({});
    this.containerDom = config.containerDom;
    this.eventDispatcher = new EventDispatcher(this.containerDom);
    this.initContainerDomStyle(config);
  }

  private initContainerDomStyle(config: CanvasHolderConfig) {
    this.containerDom.style.width = `${config.width}px`;
    this.containerDom.style.height = `${config.height}px`;
    this.containerDom.style.position = "relative";
    this.containerDom.style.overflow = "hidden";
  }

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
    return this.containerDom.getBoundingClientRect().width;
  }

  public getHeight() {
    return this.containerDom.getBoundingClientRect().height;
  }

  public setContainerSize(width: number, height: number) {
    this.containerDom.style.width = `${width}px`;
    this.containerDom.style.height = `${height}px`;
    const children = this.getChildren() as CanvasLayer[];
    for (const layer of children)
      layer.setCanvasSize(this.getWidth(), this.getHeight());
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

  constructor(eventDom: HTMLElement) {
    this.eventDom = eventDom;
  }

  public bindEventHandler() {
    if (!this.eventDom) return;
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

  private mouseMoveHandler(event: PointerEvent) {}

  private mouseDownHandler(event: PointerEvent) {}

  private mouseUpHandler(event: PointerEvent) {}
}
