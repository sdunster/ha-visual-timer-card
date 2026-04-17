import { LitElement, html, css, type TemplateResult, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { type HomeAssistant, type LovelaceCardEditor, fireEvent } from 'custom-card-helpers';
import type { VisualTimerCardConfig } from './types';
import { DEFAULTS } from './const';

interface HaFormSchemaItem {
  name: string;
  required?: boolean;
  selector: unknown;
}

const SCHEMA: ReadonlyArray<HaFormSchemaItem> = [
  {
    name: 'entity',
    required: true,
    selector: { entity: { domain: 'timer' } },
  },
  {
    name: 'size',
    selector: {
      select: {
        mode: 'dropdown',
        options: [
          { value: 'S', label: 'Small (150px)' },
          { value: 'M', label: 'Medium (250px)' },
          { value: 'L', label: 'Large (400px)' },
          { value: 'XL', label: 'Extra Large (600px)' },
        ],
      },
    },
  },
  {
    name: 'flash_duration_minutes',
    selector: { number: { min: 0, max: 60, step: 1, mode: 'box' } },
  },
  {
    name: 'completion_text',
    selector: { text: {} },
  },
];

interface ValueChangedDetail {
  value: Partial<VisualTimerCardConfig>;
}

@customElement('ha-visual-timer-card-editor')
export class VisualTimerCardEditor extends LitElement implements LovelaceCardEditor {
  @property({ attribute: false }) public hass?: HomeAssistant;
  @state() private _config?: VisualTimerCardConfig;

  public setConfig(config: VisualTimerCardConfig): void {
    this._config = config;
  }

  private _computeLabel = (schema: { name: string }): string => {
    switch (schema.name) {
      case 'entity':
        return 'Timer entity (required)';
      case 'size':
        return 'Size';
      case 'flash_duration_minutes':
        return 'Flash duration (minutes, 0 to disable)';
      case 'completion_text':
        return 'Completion text';
      default:
        return schema.name;
    }
  };

  private _valueChanged(ev: CustomEvent<ValueChangedDetail>): void {
    if (!this._config) return;
    const newConfig: VisualTimerCardConfig = { ...this._config, ...ev.detail.value };
    fireEvent(this, 'config-changed', { config: newConfig });
  }

  protected override render(): TemplateResult | typeof nothing {
    if (!this.hass || !this._config) return nothing;
    const data = {
      size: DEFAULTS.size,
      flash_duration_minutes: DEFAULTS.flash_duration_minutes,
      completion_text: DEFAULTS.completion_text,
      ...this._config,
    };
    return html`
      <ha-form
        .hass=${this.hass}
        .data=${data}
        .schema=${SCHEMA}
        .computeLabel=${this._computeLabel}
        @value-changed=${this._valueChanged}
      ></ha-form>
    `;
  }

  static override styles = css`
    :host {
      display: block;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'ha-visual-timer-card-editor': VisualTimerCardEditor;
  }
}
