/**
 * Given a circle radius, return the circumference used for stroke-dasharray.
 */
export function circumference(radius: number): number {
  return 2 * Math.PI * radius;
}

/**
 * Compute stroke-dashoffset for a given progress (0..1, where 1 = full arc shown).
 * When progress=1, offset=0 (full circle). When progress=0, offset=circumference (empty).
 * Clamped to [0,1].
 */
export function dashOffset(radius: number, progress: number): number {
  const p = Math.max(0, Math.min(1, progress));
  return circumference(radius) * (1 - p);
}

/**
 * progress = remaining / duration, clamped to [0,1].
 * Returns 0 if duration <= 0 to avoid division by zero.
 */
export function progressFromTimes(remainingSec: number, durationSec: number): number {
  if (durationSec <= 0) return 0;
  return Math.max(0, Math.min(1, remainingSec / durationSec));
}
