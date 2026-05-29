export interface Point {
  x: number;
  y: number;
}

export interface Position {
  x: number;
  y: number;
}

export interface TransformConfig {
  scaleX: number;
  scaleY: number;
  rotation: number;
}

export interface CanvasWidgetRectboxConfig {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Vector2D {
  start: Point;
  end: Point;
}

export interface DeltaValue {
  deltaX: number;
  deltaY: number;
}

export interface CanvasWidgetStyleConfig {
  fillStyle?: string;
  strokeStyle?: string;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  globalAlpha?: number;
  lineWidth?: number;
}

export class SnowflakeId {
  private epochStart: number = 1577836800000; // 2020-01-01T00:00:00.000Z
  private sequenceBitCount: number = 12;
  private sequenceMask: number = (1 << this.sequenceBitCount) - 1;
  private lastTimestamp: number = -1;
  private sequence: number = 0;

  private now(): number {
    return Date.now();
  }

  private nextMillis(): number {
    let timestamp = this.now();
    while (timestamp <= this.lastTimestamp) timestamp = this.now();
    return timestamp;
  }

  public generate(): number {
    let timestamp = this.now();
    if (timestamp < this.lastTimestamp)
      throw new Error("Clock moved backwards.");
    if (timestamp === this.lastTimestamp) {
      this.sequence = (this.sequence + 1) & this.sequenceMask;
      if (this.sequence === 0) timestamp = this.nextMillis();
    } else this.sequence = 0;
    this.lastTimestamp = timestamp;
    return (
      ((timestamp - this.epochStart) << this.sequenceBitCount) | this.sequence
    );
  }
}

export function angleToRadian(angle: number): number {
  return (angle * Math.PI) / 180;
}

export function rotatePoint(
  sourcePoint: Point,
  centerPoint: Point,
  angle: number,
): Point {
  if (angle === 0) return { ...sourcePoint };
  const radian = angleToRadian(angle);
  const cos = Math.cos(radian);
  const sin = Math.sin(radian);

  const translatedX = sourcePoint.x - centerPoint.x;
  const translatedY = sourcePoint.y - centerPoint.y;

  return {
    x: translatedX * cos - translatedY * sin + centerPoint.x,
    y: translatedX * sin + translatedY * cos + centerPoint.y,
  };
}

export function assignSameKeyToObject(
  sourceObject: Record<string, any>,
  targetObject: Record<string, any>,
) {
  for (const key in sourceObject) {
    if (sourceObject.hasOwnProperty(key)) {
      targetObject[key] = sourceObject[key];
    }
  }
}

export function calLineMidPoint(p1: Point, p2: Point): Point {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
  };
}

export function unionRectBox2Config(
  rectBoxConfig1: CanvasWidgetRectboxConfig,
  rectBoxConfig2: CanvasWidgetRectboxConfig,
) {
  const minX = Math.min(rectBoxConfig1.x, rectBoxConfig2.x);
  const minY = Math.min(rectBoxConfig1.y, rectBoxConfig2.y);
  const maxX = Math.max(
    rectBoxConfig1.x + rectBoxConfig1.width,
    rectBoxConfig2.x + rectBoxConfig2.width,
  );
  const maxY = Math.max(
    rectBoxConfig1.y + rectBoxConfig1.height,
    rectBoxConfig2.y + rectBoxConfig2.height,
  );
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

export function unionRectBoxVertexList(
  bBoxVertexList1: Point[],
  bBoxVertexList2: Point[],
) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const { x, y } of bBoxVertexList1) {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }

  for (const { x, y } of bBoxVertexList2) {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

export function rectBoxConfig2RectBoxVertexList(
  rectBoxConfig: CanvasWidgetRectboxConfig,
) {
  return [
    { x: rectBoxConfig.x, y: rectBoxConfig.y },
    { x: rectBoxConfig.x + rectBoxConfig.width, y: rectBoxConfig.y },
    {
      x: rectBoxConfig.x + rectBoxConfig.width,
      y: rectBoxConfig.y + rectBoxConfig.height,
    },
    { x: rectBoxConfig.x, y: rectBoxConfig.y + rectBoxConfig.height },
  ];
}

export function rectBoxVertexList2RectBoxConfig(rectBoxVertexList: Point[]) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const { x, y } of rectBoxVertexList) {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}
