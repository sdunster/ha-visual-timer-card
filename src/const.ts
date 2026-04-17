export const CARD_VERSION = '0.1.0';
export const CARD_NAME = 'ha-visual-timer-card';
export const CARD_FRIENDLY_NAME = 'Visual Timer Card';

export type Size = 'S' | 'M' | 'L' | 'XL';

export const SIZE_PX: Record<Size, number> = {
  S: 150,
  M: 250,
  L: 400,
  XL: 600,
};

export const DEFAULTS = {
  size: 'M' as Size,
  flash_duration_minutes: 1,
  completion_text: 'Done',
};

// Boundary thresholds (seconds)
export const HOURS_THRESHOLD = 120 * 60; // > 120 minutes -> show hours
export const MINUTES_THRESHOLD = 120; // > 120 seconds -> show minutes

// Timing
export const TICK_INTERVAL_MS = 250; // 4Hz visual refresh
export const FLASH_INTERVAL_MS = 500; // toggle every 500ms -> 1Hz on/off cycle
