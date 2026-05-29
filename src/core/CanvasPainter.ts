import {
  angleToRadian,
  assignSameKeyToObject,
  CanvasWidgetStyleConfig,
} from "../other/Utils";

export abstract class CanvasPainter {
  public save() {}

  public restore() {}

  public translate(deltaX: number, deltaY: number) {}

  public rotate(angle: number) {}

  public scale(scaleX: number, scaleY: number) {}

  public updateStyle(newStyle: CanvasWidgetStyleConfig) {}

  public beginPath() {}

  public moveTo(x: number, y: number) {}

  public lineTo(x: number, y: number) {}

  public rect(x: number, y: number, width: number, height: number) {}

  public fill() {}

  public stroke() {}

  public setTransform(
    a: number,
    b: number,
    c: number,
    d: number,
    e: number,
    f: number,
  ) {}
}

export class OriginCanvasPainter extends CanvasPainter {
  private canvasDom: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor(canvasDom: HTMLCanvasElement) {
    super();
    this.canvasDom = canvasDom;
    this.ctx = this.canvasDom.getContext("2d")!;
  }

  public save() {
    this.ctx.save();
  }

  public restore() {
    this.ctx.restore();
  }

  public translate(deltaX: number, deltaY: number) {
    this.ctx.translate(deltaX, deltaY);
  }

  public rotate(angle: number) {
    this.ctx.rotate(angleToRadian(angle));
  }

  public scale(scaleX: number, scaleY: number) {
    this.ctx.scale(scaleX, scaleY);
  }

  public updateStyle(newStyle: CanvasWidgetStyleConfig) {
    assignSameKeyToObject(newStyle, this.ctx);
  }

  public beginPath() {
    this.ctx.beginPath();
  }

  public moveTo(x: number, y: number) {
    this.ctx.moveTo(x, y);
  }

  public lineTo(x: number, y: number) {
    this.ctx.lineTo(x, y);
  }

  public rect(x: number, y: number, width: number, height: number) {
    this.ctx.rect(x, y, width, height);
  }

  public fill() {
    this.ctx.fill();
  }

  public stroke() {
    this.ctx.stroke();
  }

  public setTransform(
    a: number,
    b: number,
    c: number,
    d: number,
    e: number,
    f: number,
  ) {
    this.ctx.setTransform(a, b, c, d, e, f);
  }
}
