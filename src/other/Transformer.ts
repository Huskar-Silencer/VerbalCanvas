import { CanvasWidget } from "../core/CanvasWidget";
import { CanvasWidgetRectboxConfig, Point, rotatePoint } from "./Utils";

export enum TransformTypeEnum {
  TopResize = "top",
  BottomResize = "bottom",
  LeftResize = "left",
  RightResize = "right",
  TopLeftResize = "top-left",
  TopRightResize = "top-right",
  BottomLeftResize = "bottom-left",
  BottomRightResize = "bottom-right",
  Rotate = "rotate",
}

export interface TransformResizeCtx {
  resizeType: TransformTypeEnum;
  centerPoint: Point;
  bBoxConfig: CanvasWidgetRectboxConfig;
  rotation: number;
  solvedMousePoint: Point;
  delta: number;
}

export class Transformer {
  private child: CanvasWidget | null = null;

  public linkToChild(child: CanvasWidget) {
    this.child = child;
  }

  public transformHandle(transformType: TransformTypeEnum, mousePoint: Point) {
    if (!this.child) return;
    if (transformType === TransformTypeEnum.Rotate)
      this.rotateHandle(mousePoint);
    else this.resizeHandle(transformType, mousePoint);
  }

  private rotateHandle(mousePoint: Point) {
    if (!this.child) return;
    const centerPoint = this.child.getCenterPoint();
    const angle = Math.atan2(
      mousePoint.x - centerPoint.x,
      centerPoint.y - mousePoint.y,
    );
    this.child.updateAttrConfig({ rotation: angle });
    return;
  }

  private resizeHandle(resizeType: TransformTypeEnum, mousePoint: Point) {
    if (!this.child) return;
    const centerPoint = this.child.getCenterPoint();
    const transformHandlerCtx: TransformResizeCtx = {
      resizeType,
      centerPoint,
      bBoxConfig: this.child.getBboxConfig(),
      rotation: this.child.getRotation(),
      solvedMousePoint: rotatePoint(
        mousePoint,
        centerPoint,
        this.child.getRotation(),
      ),
      delta: 0,
    };
    const partList = resizeType.split("-") as TransformTypeEnum[];
    for (const resizeTypePart of partList) {
      transformHandlerCtx.resizeType = resizeTypePart;
      transformHandlerCtx.delta = 0;
      this.resizeDeltaAndReverseHandle(transformHandlerCtx);
      if (transformHandlerCtx.rotation === 0)
        this.noRotationResizeCal(transformHandlerCtx);
      else this.existRotationResizeCal(transformHandlerCtx);
    }
  }

  private resizeDeltaAndReverseHandle(ctx: TransformResizeCtx) {
    const maxX = ctx.bBoxConfig.x + ctx.bBoxConfig.width;
    const maxY = ctx.bBoxConfig.y + ctx.bBoxConfig.height;
    let delta = 0;
    const { resizeType, solvedMousePoint, bBoxConfig } = ctx;
    if (resizeType === "bottom") {
      delta = solvedMousePoint.y - bBoxConfig.y;
      if (delta < 0) ctx.resizeType = TransformTypeEnum.TopResize;
    } else if (resizeType === "top") {
      delta = maxY - solvedMousePoint.y;
      if (delta < 0) ctx.resizeType = TransformTypeEnum.BottomResize;
    } else if (resizeType === "left") {
      delta = maxX - solvedMousePoint.x;
      if (delta < 0) ctx.resizeType = TransformTypeEnum.RightResize;
    } else if (resizeType === "right") {
      delta = solvedMousePoint.x - bBoxConfig.x;
      if (delta < 0) ctx.resizeType = TransformTypeEnum.LeftResize;
    }

    delta = Math.abs(delta);
    ctx.delta = delta <= 1 ? 1 : delta;
  }

  private noRotationResizeCal(ctx: TransformResizeCtx) {
    const { resizeType, bBoxConfig, delta, centerPoint } = ctx;
    if (resizeType === "bottom") {
      const newCenterPoint: Point = {
        x: centerPoint.x,
        y: bBoxConfig.y + delta / 2,
      };
      const newBboxConfig: CanvasWidgetRectboxConfig = {
        x: bBoxConfig.x,
        y: bBoxConfig.y,
        width: bBoxConfig.width,
        height: delta,
      };
    } else if (resizeType === "top") {
    }
  }

  private existRotationResizeCal(transformHandlerCtx: TransformResizeCtx) {}
}
