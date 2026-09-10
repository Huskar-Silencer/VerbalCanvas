import { CanvasWidget } from "../core/CanvasWidget";
import { Point, Position, rotatePoint } from "./Utils";

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

const MIN_SIZE = 1;

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
    const angle =
      (Math.atan2(
        mousePoint.y - centerPoint.y,
        mousePoint.x - centerPoint.x,
      ) *
        180) /
      Math.PI;
    this.child.updateAttrConfig({ rotation: angle });
  }

  private resizeHandle(resizeType: TransformTypeEnum, mousePoint: Point) {
    if (!this.child) return;

    const bBoxConfig = this.child.getBboxConfig();
    const centerPoint = this.child.getCenterPoint();
    const position = this.child.getPosition();
    const transformConfig = this.child.getTransformConfig();

    const width = bBoxConfig.width;
    const height = bBoxConfig.height;
    const halfWidth = (width * transformConfig.scaleX) / 2;
    const halfHeight = (height * transformConfig.scaleY) / 2;
    const minX = centerPoint.x - halfWidth;
    const minY = centerPoint.y - halfHeight;
    const maxX = centerPoint.x + halfWidth;
    const maxY = centerPoint.y + halfHeight;

    // Rotate the mouse point back so the anchor is axis-aligned in the unrotated space
    const localMouse = rotatePoint(
      mousePoint,
      centerPoint,
      -transformConfig.rotation,
    );

    let newMinX = minX;
    let newMinY = minY;
    let newMaxX = maxX;
    let newMaxY = maxY;

    switch (resizeType) {
      case TransformTypeEnum.RightResize:
        newMaxX = Math.max(localMouse.x, minX + MIN_SIZE);
        break;
      case TransformTypeEnum.LeftResize:
        newMinX = Math.min(localMouse.x, maxX - MIN_SIZE);
        break;
      case TransformTypeEnum.BottomResize:
        newMaxY = Math.max(localMouse.y, minY + MIN_SIZE);
        break;
      case TransformTypeEnum.TopResize:
        newMinY = Math.min(localMouse.y, maxY - MIN_SIZE);
        break;
      case TransformTypeEnum.TopLeftResize:
        newMinX = Math.min(localMouse.x, maxX - MIN_SIZE);
        newMinY = Math.min(localMouse.y, maxY - MIN_SIZE);
        break;
      case TransformTypeEnum.TopRightResize:
        newMaxX = Math.max(localMouse.x, minX + MIN_SIZE);
        newMinY = Math.min(localMouse.y, maxY - MIN_SIZE);
        break;
      case TransformTypeEnum.BottomLeftResize:
        newMinX = Math.min(localMouse.x, maxX - MIN_SIZE);
        newMaxY = Math.max(localMouse.y, minY + MIN_SIZE);
        break;
      case TransformTypeEnum.BottomRightResize:
        newMaxX = Math.max(localMouse.x, minX + MIN_SIZE);
        newMaxY = Math.max(localMouse.y, minY + MIN_SIZE);
        break;
      default:
        return;
    }

    const newScaleX = width !== 0 ? (newMaxX - newMinX) / width : transformConfig.scaleX;
    const newScaleY = height !== 0 ? (newMaxY - newMinY) / height : transformConfig.scaleY;
    const newCenter: Point = {
      x: (newMinX + newMaxX) / 2,
      y: (newMinY + newMaxY) / 2,
    };
    const offset = { x: centerPoint.x - position.x, y: centerPoint.y - position.y };
    const newPosition: Position = {
      x: newCenter.x - offset.x,
      y: newCenter.y - offset.y,
    };

    this.child.updateAttrConfig({
      position: newPosition,
      scaleX: newScaleX,
      scaleY: newScaleY,
    });
  }
}
