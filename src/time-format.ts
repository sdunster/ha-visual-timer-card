import { HOURS_THRESHOLD, MINUTES_THRESHOLD } from './const';

/**
 * Parse a Home Assistant duration string "HH:MM:SS" into total seconds.
 * Supports "H:MM:SS" (no zero-pad) and fractional seconds.
 */
export function parseHmsToSeconds(hms: string | undefined | null): number {
  if (!hms) return 0;
  const parts = hms.split(':');
  if (parts.length !== 3) return 0;
  const [hStr, mStr, sStr] = parts;
  if (hStr === undefined || mStr === undefined || sStr === undefined) return 0;
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  const s = parseFloat(sStr);
  if (isNaN(h) || isNaN(m) || isNaN(s)) return 0;
  return h * 3600 + m * 60 + s;
}

export interface FormattedTime {
  value: number;
  unit: 'h' | 'm' | 's';
}

/**
 * Format remaining seconds per spec:
 *   > 7200s  (> 120 min)  -> hours,   rounded to nearest  ("2h")
 *   > 120s   (> 120 sec)  -> minutes, rounded to nearest  ("5m")
 *   else                   -> seconds, rounded to nearest ("45s")
 *
 * Negative input is clamped to 0.
 */
export function formatRemaining(seconds: number): FormattedTime {
  const s = Math.max(0, seconds);
  if (s > HOURS_THRESHOLD) {
    return { value: Math.round(s / 3600), unit: 'h' };
  }
  if (s > MINUTES_THRESHOLD) {
    return { value: Math.round(s / 60), unit: 'm' };
  }
  return { value: Math.round(s), unit: 's' };
}
