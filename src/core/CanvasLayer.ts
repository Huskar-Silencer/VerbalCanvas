import { Point, Position } from "../other/Utils";
import { CanvasPainter, OriginCanvasPainter } from "./CanvasPainter";
import { CanvasContainerWidget } from "./CanvasContainerWidget";
import {
  CanvasWidget,
  CanvasWidgetEvent,
  CanvasWidgetEventTypeEnum,
  CanvasWidgetTypeEnum,
} from "./CanvasWidget";
import { CanvasShapeWidget } from "./CanvasShapeWidget";
import { Group } from "./Group";
import { BBox, RTree, RTreeEntry } from "../VerbalRTree";

interface CanvasLayerStateConfig {
  cameraPosition: Position;
  zoomValue: number;
  isBatchPainting: boolean;
}

type CanvasLayerChildType = CanvasShapeWidget | Group;

export class CanvasLayer extends CanvasContainerWidget<CanvasLayerChildType> {
  private canvasDom: HTMLCanvasElement;

  private painter: CanvasPainter;

  private rTree: RTree<CanvasWidget> = new RTree<CanvasWidget>();

  private rTreeEntryMap: Map<CanvasWidget, RTreeEntry<CanvasWidget>> =
    new Map();

  private layerStateConfig: CanvasLayerStateConfig = {
    cameraPosition: { x: 0, y: 0 },
    zoomValue: 1,
    isBatchPainting: false,
  };

  private onChildChange = (event: CanvasWidgetEvent) => {
    this.batchPaint();
    const target = event.targetWidget;
    if (!target) return;
    let cur: CanvasWidget | null = target;
    while (cur && cur.getParent() !== this) cur = cur.getParent();
    if (cur) this.updateRTreeEntry(cur);
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
    const dpr = window.devicePixelRatio || 1;
    this.canvasDom.width = width * dpr;
    this.canvasDom.height = height * dpr;
    const { cameraPosition, zoomValue } = this.layerStateConfig;
    const scale = zoomValue * dpr;
    this.painter.setTransform(
      scale,
      0,
      0,
      scale,
      -cameraPosition.x * scale,
      -cameraPosition.y * scale,
    );
  }

  public screenPointToWorldPoint(point: Point): Point {
    const { cameraPosition, zoomValue } = this.layerStateConfig;
    return {
      x: point.x / zoomValue + cameraPosition.x,
      y: point.y / zoomValue + cameraPosition.y,
    };
  }

  public checkPointInWidget(point: Point): CanvasWidget | null {
    const query: BBox = {
      minX: point.x,
      minY: point.y,
      maxX: point.x,
      maxY: point.y,
    };
    const candidates = this.rTree.search(query);
    const candidateSet = new Set(candidates.map((entry) => entry.data));
    const children = this.getChildren();
    for (let i = children.length - 1; i >= 0; i--) {
      const widget = children[i];
      if (!candidateSet.has(widget)) continue;
      const hit = widget.hitTest(point);
      if (hit) return hit;
    }
    return null;
  }

  private updateRTreeEntry(child: CanvasWidget) {
    const oldEntry = this.rTreeEntryMap.get(child);
    if (oldEntry) this.rTree.delete(oldEntry);
    const entry: RTreeEntry<CanvasWidget> = {
      bbox: child.getWorldBbox(),
      data: child,
    };
    this.rTree.insert(entry);
    this.rTreeEntryMap.set(child, entry);
  }

  private removeRTreeEntry(child: CanvasWidget) {
    const oldEntry = this.rTreeEntryMap.get(child);
    if (oldEntry) {
      this.rTree.delete(oldEntry);
      this.rTreeEntryMap.delete(child);
    }
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
    painter.clearRect(0, 0, this.canvasDom.width, this.canvasDom.height);
    const children = this.getChildren();
    for (const child of children) child.paint(painter);
  }

  public addChild(...children: CanvasLayerChildType[]) {
    for (const child of children) {
      child.place2Parent(this);
      child.addEvent(CanvasWidgetEventTypeEnum.OnChange, this.onChildChange);
      this.updateRTreeEntry(child);
    }
    this.batchPaint();
  }

  public removeChild(...children: CanvasLayerChildType[]) {
    for (const child of children) {
      this.removeRTreeEntry(child);
      child.remove();
      child.removeEvent(CanvasWidgetEventTypeEnum.OnChange, this.onChildChange);
    }
    this.batchPaint();
  }
}
