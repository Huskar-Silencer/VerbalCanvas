import { Point, Position } from "../other/Utils";
import { CanvasPainter, OriginCanvasPainter } from "./CanvasPainter";
import { CanvasContainerWidget } from "./CanvasContainerWidget";
import {
  CanvasWidget,
  CanvasWidgetEventTypeEnum,
  CanvasWidgetTypeEnum,
} from "./CanvasWidget";
import { CanvasShapeWidget } from "./CanvasShapeWidget";
import { Group } from "./Group";

interface CanvasLayerStateConfig {
  cameraPosition: Position;
  zoomValue: number;
  isBatchPainting: boolean;
}

type CanvasLayerChildType = CanvasShapeWidget | Group;

export class CanvasLayer extends CanvasContainerWidget<CanvasLayerChildType> {
  private canvasDom: HTMLCanvasElement;

  private painter: CanvasPainter;

  private layerStateConfig: CanvasLayerStateConfig = {
    cameraPosition: { x: 0, y: 0 },
    zoomValue: 1,
    isBatchPainting: false,
  };

  constructor() {
    super({});
    this.canvasDom = document.createElement("canvas");
    this.painter = new OriginCanvasPainter(this.canvasDom);
    this.initCanvasDomStyle();
  }

  private initCanvasDomStyle() {
    this.canvasDom.style.position = "absolute";
    this.canvasDom.style.top = "0px";
    this.canvasDom.style.left = "0px";
    this.canvasDom.style.width = "100%";
    this.canvasDom.style.height = "100%";
  }

  public override getWidgetType() {
    return CanvasWidgetTypeEnum.Layer;
  }

  public getCanvasDom() {
    return this.canvasDom;
  }

  public setCanvasSize(width: number, height: number) {
    this.canvasDom.width = width;
    this.canvasDom.height = height;
    this.painter.setTransform(
      this.layerStateConfig.zoomValue,
      0,
      0,
      this.layerStateConfig.zoomValue,
      -this.layerStateConfig.cameraPosition.x * this.layerStateConfig.zoomValue,
      -this.layerStateConfig.cameraPosition.y * this.layerStateConfig.zoomValue,
    );
  }

  public checkPointInWidget(point: Point): CanvasWidget | null {
    const children = this.getChildren();
    for (let i = children.length - 1; i >= 0; i--) {
      const widget = children[i];
      if (!widget.isPointInShape(point)) continue;
      return widget;
    }
    return null;
  }

  public batchPaint() {
    if (this.layerStateConfig.isBatchPainting) return;
    this.layerStateConfig.isBatchPainting = true;
    requestAnimationFrame(() => {
      this.paint(this.painter);
      this.layerStateConfig.isBatchPainting = false;
    });
  }

  protected subPaint(painter: CanvasPainter) {
    const children = this.getChildren();
    for (const child of children) child.paint(painter);
  }

  public addChild(...children: CanvasLayerChildType[]) {
    for (const child of children) {
      child.place2Parent(this);
      child.addEvent(CanvasWidgetEventTypeEnum.OnChange, this.batchPaint);
    }
    this.batchPaint();
  }

  public removeChild(...children: CanvasLayerChildType[]) {
    for (const child of children) {
      child.remove();
      child.removeEvent(CanvasWidgetEventTypeEnum.OnChange, this.batchPaint);
    }
    this.batchPaint();
  }
}
