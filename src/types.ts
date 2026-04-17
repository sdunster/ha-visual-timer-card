import type { LovelaceCardConfig } from 'custom-card-helpers';
import type { Size } from './const';

export interface VisualTimerCardConfig extends LovelaceCardConfig {
  type: string;
  entity: string;
  size?: Size;
  flash_duration_minutes?: number;
  completion_text?: string;
}

export interface TimerAttributes {
  duration?: string; // "HH:MM:SS"
  remaining?: string; // "HH:MM:SS" (idle/paused)
  finishes_at?: string; // ISO (active)
  friendly_name?: string;
}

export type TimerState = 'active' | 'paused' | 'idle' | 'unavailable' | 'unknown';

export interface TimerStateObject {
  entity_id: string;
  state: TimerState | string;
  attributes: TimerAttributes;
  last_changed?: string;
  last_updated?: string;
}

export interface CustomCardEntry {
  type: string;
  name: string;
  description?: string;
  preview?: boolean;
  documentationURL?: string;
}

declare global {
  interface Window {
    customCards?: CustomCardEntry[];
  }
}
