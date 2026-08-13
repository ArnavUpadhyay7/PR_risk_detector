const timers = new Map<string, number>();

export function startTimer(label: string): void {
  timers.set(label, performance.now());
}

export function endTimer(label: string): number {
  const started = timers.get(label);
  if (started === undefined) {
    return 0;
  }

  const duration = Math.round(performance.now() - started);
  timers.delete(label);
  console.log(`[Graph] ${label}: ${duration}ms`);
  return duration;
}

export function logDuration(prefix: string, label: string, durationMs: number): void {
  console.log(`[${prefix}] ${label}: ${durationMs}ms`);
}
