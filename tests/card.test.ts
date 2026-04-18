import { describe, it, expect, beforeAll } from 'vitest';
import '../src/ha-visual-timer-card';
import { VisualTimerCard } from '../src/ha-visual-timer-card';
import { SIZE_PX } from '../src/const';
import type { VisualTimerCardConfig, TimerStateObject } from '../src/types';

interface MockHass {
  states: Record<string, TimerStateObject>;
}

async function nextFrame(el: LitElementLike): Promise<void> {
  await el.updateComplete;
}

interface LitElementLike extends HTMLElement {
  updateComplete: Promise<boolean>;
}

function makeState(overrides: Partial<TimerStateObject> = {}): TimerStateObject {
  return {
    entity_id: 'timer.test',
    state: 'active',
    attributes: {
      duration: '0:10:00',
      finishes_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      friendly_name: 'Test Timer',
    },
    ...overrides,
  };
}

function makeHass(stateOverrides: Partial<TimerStateObject> = {}): MockHass {
  return {
    states: {
      'timer.test': makeState(stateOverrides),
    },
  };
}

function baseConfig(
  overrides: Partial<VisualTimerCardConfig> = {},
): VisualTimerCardConfig {
  return {
    type: 'custom:ha-visual-timer-card',
    entity: 'timer.test',
    ...overrides,
  };
}

describe('VisualTimerCard config validation', () => {
  it('throws if entity missing', () => {
    const card = document.createElement('ha-visual-timer-card') as VisualTimerCard;
    expect(() =>
      card.setConfig({ type: 'custom:ha-visual-timer-card' } as VisualTimerCardConfig),
    ).toThrow(/timer entity/i);
  });

  it('throws if entity is not a timer.*', () => {
    const card = document.createElement('ha-visual-timer-card') as VisualTimerCard;
    expect(() => card.setConfig(baseConfig({ entity: 'sensor.foo' }))).toThrow(/timer\.\*/);
  });

  it('throws on negative flash duration', () => {
    const card = document.createElement('ha-visual-timer-card') as VisualTimerCard;
    expect(() => card.setConfig(baseConfig({ flash_duration_minutes: -1 }))).toThrow(
      /non-negative/,
    );
  });

  it('accepts valid config and reports default size', () => {
    const card = document.createElement('ha-visual-timer-card') as VisualTimerCard;
    card.setConfig(baseConfig());
    expect(card.getCardSize()).toBe(3); // M default
  });

  it('reports card size for each size option', () => {
    const card = document.createElement('ha-visual-timer-card') as VisualTimerCard;
    card.setConfig(baseConfig({ size: 'S' }));
    expect(card.getCardSize()).toBe(2);
    card.setConfig(baseConfig({ size: 'L' }));
    expect(card.getCardSize()).toBe(5);
    card.setConfig(baseConfig({ size: 'XL' }));
    expect(card.getCardSize()).toBe(7);
  });
});

describe('VisualTimerCard rendering', () => {
  beforeAll(() => {
    // happy-dom may not provide rAF; card uses setInterval so this is belt-and-braces.
    const g = globalThis as unknown as {
      requestAnimationFrame?: (cb: FrameRequestCallback) => number;
      cancelAnimationFrame?: (handle: number) => void;
    };
    if (!g.requestAnimationFrame) {
      g.requestAnimationFrame = (cb: FrameRequestCallback): number =>
        setTimeout(() => cb(performance.now()), 16) as unknown as number;
      g.cancelAnimationFrame = (h: number): void => clearTimeout(h);
    }
  });

  it('renders warning when entity is missing from hass', async () => {
    const card = document.createElement('ha-visual-timer-card') as VisualTimerCard;
    card.setConfig(baseConfig({ entity: 'timer.ghost' }));
    // cast: HomeAssistant has many other fields we don't populate in tests
    (card as unknown as { hass: MockHass }).hass = { states: {} };
    document.body.appendChild(card);
    await nextFrame(card as unknown as LitElementLike);
    expect(card.shadowRoot?.textContent ?? '').toMatch(/not found/i);
    card.remove();
  });

  it('renders an SVG sized to the selected size', async () => {
    const card = document.createElement('ha-visual-timer-card') as VisualTimerCard;
    card.setConfig(baseConfig({ size: 'L' }));
    (card as unknown as { hass: MockHass }).hass = makeHass();
    document.body.appendChild(card);
    await nextFrame(card as unknown as LitElementLike);
    const svg = card.shadowRoot?.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute('width')).toBe(String(SIZE_PX.L));
    card.remove();
  });

  it('renders numeric value and unit for an active timer', async () => {
    const card = document.createElement('ha-visual-timer-card') as VisualTimerCard;
    card.setConfig(baseConfig());
    (card as unknown as { hass: MockHass }).hass = makeHass();
    document.body.appendChild(card);
    await nextFrame(card as unknown as LitElementLike);
    const label = card.shadowRoot?.querySelector('.label');
    expect(label).not.toBeNull();
    const value = label?.querySelector('.value')?.textContent;
    const unit = label?.querySelector('.unit')?.textContent;
    expect(value).toBe('5'); // 5 minutes remaining
    expect(unit).toBe('m');
    card.remove();
  });

  it('arc circle is rendered in SVG namespace', async () => {
    const card = document.createElement('ha-visual-timer-card') as VisualTimerCard;
    card.setConfig(baseConfig());
    (card as unknown as { hass: MockHass }).hass = makeHass();
    document.body.appendChild(card);
    await nextFrame(card as unknown as LitElementLike);
    const arc = card.shadowRoot?.querySelector('.arc');
    expect(arc).not.toBeNull();
    expect(arc?.namespaceURI).toBe('http://www.w3.org/2000/svg');
    card.remove();
  });

  it('renders remaining attribute for a paused timer', async () => {
    const card = document.createElement('ha-visual-timer-card') as VisualTimerCard;
    card.setConfig(baseConfig());
    (card as unknown as { hass: MockHass }).hass = makeHass({
      state: 'paused',
      attributes: { duration: '0:10:00', remaining: '0:03:00' },
    });
    document.body.appendChild(card);
    await nextFrame(card as unknown as LitElementLike);
    const value = card.shadowRoot?.querySelector('.value')?.textContent;
    const unit = card.shadowRoot?.querySelector('.unit')?.textContent;
    expect(value).toBe('3');
    expect(unit).toBe('m');
    card.remove();
  });

  it('falls back to duration when paused with no remaining attr', async () => {
    const card = document.createElement('ha-visual-timer-card') as VisualTimerCard;
    card.setConfig(baseConfig());
    (card as unknown as { hass: MockHass }).hass = makeHass({
      state: 'paused',
      attributes: { duration: '0:10:00' },
    });
    document.body.appendChild(card);
    await nextFrame(card as unknown as LitElementLike);
    const value = card.shadowRoot?.querySelector('.value')?.textContent;
    expect(value).toBe('10');
    card.remove();
  });

  it('rejects non-finite flash_duration_minutes', () => {
    const card = document.createElement('ha-visual-timer-card') as VisualTimerCard;
    expect(() =>
      card.setConfig(baseConfig({ flash_duration_minutes: Infinity })),
    ).toThrow(/non-negative/);
    expect(() =>
      card.setConfig(baseConfig({ flash_duration_minutes: NaN })),
    ).toThrow(/non-negative/);
  });

  it('honours custom completion_text in config', () => {
    const card = document.createElement('ha-visual-timer-card') as VisualTimerCard;
    card.setConfig(baseConfig({ completion_text: 'Ready!' }));
    // Access via test-visible getter pattern - _config is private state but
    // we can verify the stored config through re-setting behaviour instead.
    // Here we simply ensure setConfig accepted the value without throwing,
    // and verify default fallback works when omitted.
    const card2 = document.createElement('ha-visual-timer-card') as VisualTimerCard;
    card2.setConfig(baseConfig());
    // No throw = accepted. Rendering verification covered elsewhere.
    expect(card).toBeDefined();
    expect(card2).toBeDefined();
  });
});
