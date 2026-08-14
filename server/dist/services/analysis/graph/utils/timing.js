const timers = new Map();
export function startTimer(label) {
    timers.set(label, performance.now());
}
export function endTimer(label) {
    const started = timers.get(label);
    if (started === undefined) {
        return 0;
    }
    const duration = Math.round(performance.now() - started);
    timers.delete(label);
    console.log(`[Graph] ${label}: ${duration}ms`);
    return duration;
}
export function logDuration(prefix, label, durationMs) {
    console.log(`[${prefix}] ${label}: ${durationMs}ms`);
}
//# sourceMappingURL=timing.js.map