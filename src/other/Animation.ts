export interface AnimationFrame {
  // Total elapsed time since the first frame (ms)
  time: number;
  // Time since the previous execution (ms)
  timeDiff: number;
  // How many times the callback has been executed (1-based)
  frameCount: number;
}

export interface AnimationConfig {
  // Delay in ms between executions (and before the first one). Default 0.
  delay?: number;
  // Total number of executions. Omit or set to Infinity to run forever. Default infinite.
  times?: number;
}

export type AnimationCallback = (frame: AnimationFrame) => void;

export class Animation {
  private callback: AnimationCallback;

  private delay: number;

  private times: number;

  private running: boolean = false;

  private initialized: boolean = false;

  private startTime: number = 0;

  private lastRunTime: number = 0;

  private frameCount: number = 0;

  private rafId: number | null = null;

  constructor(callback: AnimationCallback, config: AnimationConfig = {}) {
    this.callback = callback;
    this.delay = Math.max(0, config.delay ?? 0);
    this.times = config.times ?? Infinity;
  }

  public start() {
    if (this.running) return;
    this.running = true;
    this.frameCount = 0;
    this.initialized = false;
    this.rafId = requestAnimationFrame(this.tick);
  }

  public stop() {
    this.running = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  public isRunning() {
    return this.running;
  }

  private tick = (now: number) => {
    if (!this.running) return;

    if (!this.initialized) {
      this.initialized = true;
      this.startTime = now;
      this.lastRunTime = now;
    }

    if (now - this.lastRunTime >= this.delay) {
      const timeDiff = now - this.lastRunTime;
      this.lastRunTime = now;
      this.frameCount++;
      this.callback({
        time: now - this.startTime,
        timeDiff,
        frameCount: this.frameCount,
      });
    }

    if (this.frameCount >= this.times) {
      this.stop();
      return;
    }

    this.rafId = requestAnimationFrame(this.tick);
  };
}
