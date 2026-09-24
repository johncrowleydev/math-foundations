// Interaction-to-interaction time, with at most 30 seconds of silence counted.
// Hidden/blurred windows contribute no additional time. No keystrokes are recorded.
export class EffortClock {
  private last?: number;
  startedAt?: number;
  activeDurationMs: number;
  constructor(saved: { startedAt?: number; activeDurationMs?: number } = {}) {
    this.startedAt = saved.startedAt;
    this.activeDurationMs = saved.activeDurationMs || 0;
  }
  get active() {
    return this.last !== undefined;
  }
  touch(now = Date.now()) {
    this.startedAt ??= now;
    if (this.last !== undefined)
      this.activeDurationMs += Math.min(30000, Math.max(0, now - this.last));
    this.last = now;
    return this.value();
  }
  pause(now = Date.now()) {
    if (this.last !== undefined) this.touch(now);
    this.last = undefined;
    return this.value();
  }
  value() {
    return { startedAt: this.startedAt, activeDurationMs: this.activeDurationMs };
  }
}
