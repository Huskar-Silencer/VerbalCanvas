export type customPaintFnType = (ctx: CanvasRenderingContext2D) => void;

export class CustomShape {
  private customPaintFn: customPaintFnType;

  constructor(customPaintFn: customPaintFnType) {
    this.customPaintFn = customPaintFn;
  }
}
