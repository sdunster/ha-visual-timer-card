import { LitElement, html, svg, css, type PropertyValues, type TemplateResult, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { HomeAssistant, LovelaceCard, LovelaceCardEditor } from 'custom-card-helpers';

import {
  CARD_NAME,
  CARD_FRIENDLY_NAME,
  CARD_VERSION,
  DEFAULTS,
  SIZE_PX,
  TICK_INTERVAL_MS,
  FLASH_INTERVAL_MS,
  type Size,
} from './const';
import type {
  VisualTimerCardConfig,
  TimerAttributes,
  TimerState,
  TimerStateObject,
} from './types';
import { parseHmsToSeconds, formatRemaining } from './time-format';
import { circumference, dashOffset, progressFromTimes } from './arc-geometry';

/* eslint-disable no-console */
console.info(
  `%c ${CARD_FRIENDLY_NAME} %c v${CARD_VERSION} `,
  'color: white; background: #03a9f4; font-weight: 700;',
  'color: #03a9f4; background: white; font-weight: 700;',
);

// Register with Lovelace card picker
window.customCards = window.customCards ?? [];
window.customCards.push({
  type: CARD_NAME,
  name: CARD_FRIENDLY_NAME,
  description: 'A circular visual timer card that tracks a timer.* entity.',
});

@customElement(CARD_NAME)
export class VisualTimerCard extends LitElement implements LovelaceCard {
  @property({ attribute: false }) public hass?: HomeAssistant;
  @state() private _config?: VisualTimerCardConfig;
  @state() private _now: number = Date.now();
  @state() private _flashing = false;
  @state() private _flashOn = true;

  private _tickInterval?: number;
  private _flashInterval?: number;
  private _flashTimeout?: number;
  private _lastState?: TimerState | string;

  public static async getConfigElement(): Promise<LovelaceCardEditor> {
    await import('./editor');
    return document.createElement('ha-visual-timer-card-editor') as LovelaceCardEditor;
  }

  public static getStubConfig(): Partial<VisualTimerCardConfig> {
    return {
      entity: '',
      size: DEFAULTS.size,
      flash_duration_minutes: DEFAULTS.flash_duration_minutes,
      completion_text: DEFAULTS.completion_text,
    };
  }

  public setConfig(config: VisualTimerCardConfig): void {
    if (!config || !config.entity) {
      throw new Error('You must specify a timer entity.');
    }
    if (!config.entity.startsWith('timer.')) {
      throw new Error('Entity must be a timer.* entity.');
    }
    const flash = config.flash_duration_minutes;
    if (flash !== undefined && (typeof flash !== 'number' || flash < 0 || !isFinite(flash))) {
      throw new Error('flash_duration_minutes must be a non-negative number.');
    }
    this._config = {
      ...config,
      size: config.size ?? DEFAULTS.size,
      flash_duration_minutes: flash ?? DEFAULTS.flash_duration_minutes,
      completion_text: config.completion_text ?? DEFAULTS.completion_text,
    };
  }

  public getCardSize(): number {
    const size = this._config?.size ?? DEFAULTS.size;
    if (size === 'S') return 2;
    if (size === 'L') return 5;
    if (size === 'XL') return 7;
    return 3;
  }

  public override connectedCallback(): void {
    super.connectedCallback();
    this._startTicking();
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._stopTicking();
    this._stopFlashing();
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed);
    if (!this._config || !this.hass) return;
    const stateObj = this._getStateObj();
    if (!stateObj) return;

    const currentState = stateObj.state;

    // Detect active -> idle transition -> start flash
    if (
      this._lastState === 'active' &&
      currentState === 'idle' &&
      (this._config.flash_duration_minutes ?? 0) > 0
    ) {
      this._startFlashing();
    }
    this._lastState = currentState;
  }

  private _getStateObj(): TimerStateObject | undefined {
    if (!this.hass || !this._config) return undefined;
    // HomeAssistant.states is typed loosely; narrow to our shape.
    const raw = this.hass.states[this._config.entity];
    if (!raw) return undefined;
    return raw as unknown as TimerStateObject;
  }

  private _startTicking(): void {
    this._stopTicking();
    // 4Hz is plenty for a smooth-looking arc while staying easy on the CPU.
    this._tickInterval = window.setInterval(() => {
      this._now = Date.now();
    }, TICK_INTERVAL_MS);
  }

  private _stopTicking(): void {
    if (this._tickInterval !== undefined) {
      window.clearInterval(this._tickInterval);
      this._tickInterval = undefined;
    }
  }

  private _startFlashing(): void {
    this._stopFlashing();
    this._flashing = true;
    this._flashOn = true;
    this._flashInterval = window.setInterval(() => {
      this._flashOn = !this._flashOn;
    }, FLASH_INTERVAL_MS);
    const mins = this._config?.flash_duration_minutes ?? DEFAULTS.flash_duration_minutes;
    this._flashTimeout = window.setTimeout(() => {
      this._stopFlashing();
    }, mins * 60 * 1000);
  }

  private _stopFlashing(): void {
    if (this._flashInterval !== undefined) {
      window.clearInterval(this._flashInterval);
      this._flashInterval = undefined;
    }
    if (this._flashTimeout !== undefined) {
      window.clearTimeout(this._flashTimeout);
      this._flashTimeout = undefined;
    }
    this._flashing = false;
    this._flashOn = true;
  }

  private _getRemainingSeconds(
    state: TimerState | string,
    attrs: TimerAttributes,
  ): number {
    if (state === 'active' && attrs.finishes_at) {
      const finishes = Date.parse(attrs.finishes_at);
      if (!isNaN(finishes)) {
        return Math.max(0, (finishes - this._now) / 1000);
      }
    }
    // paused or idle: use remaining attribute, else duration
    if (attrs.remaining) return parseHmsToSeconds(attrs.remaining);
    if (attrs.duration) return parseHmsToSeconds(attrs.duration);
    return 0;
  }

  protected override render(): TemplateResult | typeof nothing {
    if (!this._config || !this.hass) return nothing;
    const stateObj = this._getStateObj();
    if (!stateObj) {
      return html`
        <ha-card>
          <div class="warning">Entity not found: ${this._config.entity}</div>
        </ha-card>
      `;
    }

    const size: Size = this._config.size ?? DEFAULTS.size;
    const px = SIZE_PX[size];
    const strokeWidth = Math.round(px * 0.12); // thick/bold
    const radius = (px - strokeWidth) / 2;
    const cx = px / 2;
    const cy = px / 2;
    const circ = circumference(radius);

    const state = stateObj.state;
    const attrs = stateObj.attributes;
    const durationSec = parseHmsToSeconds(attrs.duration);
    const remainingSec = this._getRemainingSeconds(state, attrs);
    const progress = progressFromTimes(remainingSec, durationSec);
    const offset = dashOffset(radius, progress);

    const showCompletion = this._flashing;
    const arcVisible = showCompletion ? this._flashOn : true;
    const completionText = this._config.completion_text ?? DEFAULTS.completion_text;

    let displayText: string;
    let displayUnit: string;
    if (showCompletion) {
      displayText = completionText;
      displayUnit = '';
    } else {
      const f = formatRemaining(remainingSec);
      displayText = String(f.value);
      displayUnit = f.unit;
    }

    const fontSize = Math.round(px * 0.22);
    const unitSize = Math.round(px * 0.12);

    return html`
      <ha-card>
        <div class="container" style="width:${px}px;height:${px}px;">
          <svg
            width="${px}"
            height="${px}"
            viewBox="0 0 ${px} ${px}"
            class=${showCompletion ? 'flashing' : ''}
          >
            <circle
              class="track"
              cx="${cx}"
              cy="${cy}"
              r="${radius}"
              stroke-width="${strokeWidth}"
              fill="none"
            />
            ${arcVisible
              ? svg`<circle
                  class="arc"
                  cx="${cx}"
                  cy="${cy}"
                  r="${radius}"
                  stroke-width="${strokeWidth}"
                  fill="none"
                  stroke-dasharray="${circ}"
                  stroke-dashoffset="${offset}"
                  transform="rotate(-90 ${cx} ${cy})"
                  stroke-linecap="round"
                />`
              : nothing}
          </svg>
          <div
            class="label ${showCompletion && !this._flashOn ? 'hidden' : ''}"
            style="font-size:${fontSize}px;"
          >
            <span class="value">${displayText}</span>
            ${displayUnit
              ? html`<span class="unit" style="font-size:${unitSize}px;"
                  >${displayUnit}</span
                >`
              : nothing}
          </div>
        </div>
      </ha-card>
    `;
  }

  static override styles = css`
    ha-card {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
    }
    .container {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    svg {
      position: absolute;
      inset: 0;
    }
    .track {
      stroke: var(--divider-color, rgba(127, 127, 127, 0.2));
    }
    .arc {
      stroke: var(--primary-color);
      transition: stroke-dashoffset 0.2s linear;
    }
    .label {
      position: relative;
      display: flex;
      align-items: baseline;
      gap: 2px;
      font-weight: 700;
      color: var(--primary-text-color);
      font-family: var(--paper-font-body1_-_font-family, inherit);
    }
    .label.hidden {
      visibility: hidden;
    }
    .unit {
      font-weight: 500;
      color: var(--secondary-text-color);
    }
    .warning {
      padding: 16px;
      color: var(--error-color, red);
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'ha-visual-timer-card': VisualTimerCard;
  }
}
