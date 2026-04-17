# Visual Timer Card

A circular visual timer card for Home Assistant that tracks a built-in `timer.*` entity.

The arc starts whole and sweeps down to zero as the timer runs. Remaining time is shown as a single number plus unit (`h`, `m`, or `s`), chosen automatically based on how much time is left. When the timer finishes, the card flashes once per second for a configurable duration while displaying a completion message.

[![Test](https://github.com/sdunster/ha-visual-timer-card/actions/workflows/test.yml/badge.svg)](https://github.com/sdunster/ha-visual-timer-card/actions/workflows/test.yml)
[![HACS Custom](https://img.shields.io/badge/HACS-Custom-orange.svg)](https://hacs.xyz)

## Features

- Big, bold arc using your theme's `--primary-color`
- Smart unit display:
  - More than 120 minutes remaining → hours (`2h`)
  - More than 120 seconds remaining → minutes (`5m`)
  - Otherwise → seconds (`45s`)
- All values rounded to the nearest unit
- Configurable completion flash (duration and text)
- Four fixed sizes: **S** (150px), **M** (250px), **L** (400px), **XL** (600px)
- Visual config editor (no YAML required)

## Requirements

- Home Assistant **2023.4** or newer
- At least one `timer.*` helper entity configured (either via **Settings → Devices & Services → Helpers → Timer** or in `configuration.yaml`)

## Installation

### HACS (recommended)

1. Open HACS in Home Assistant.
2. Go to **Frontend**.
3. Click the three-dot menu → **Custom repositories**.
4. Add this repo URL, category **Lovelace**.
5. Click **Install** on *Visual Timer Card*.
6. Reload the dashboard (or restart HA).

HACS will automatically add the resource for you. If it doesn't, add it manually:

- **Settings → Dashboards → Resources → Add resource**
- URL: `/hacsfiles/ha-visual-timer-card/ha-visual-timer-card.js`
- Type: **JavaScript module**

### Manual installation

1. Download `ha-visual-timer-card.js` from the [latest release](https://github.com/sdunster/ha-visual-timer-card/releases/latest).
2. Copy it to `<config>/www/` in your Home Assistant config directory.
3. Add the resource: **Settings → Dashboards → Resources → Add resource**
   - URL: `/local/ha-visual-timer-card.js`
   - Type: **JavaScript module**
4. Reload the dashboard.

## Configuration

Add via the visual card picker (search "Visual Timer Card") or in YAML:

```yaml
type: custom:ha-visual-timer-card
entity: timer.pasta
size: M
flash_duration_minutes: 1
completion_text: Done
```

### Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `entity` | string | *required* | A `timer.*` entity to track. |
| `size` | `S` \| `M` \| `L` \| `XL` | `M` | Card/arc size. S = 150px, M = 250px, L = 400px, XL = 600px. |
| `flash_duration_minutes` | number | `1` | How long to flash after completion. Set to `0` to disable. |
| `completion_text` | string | `Done` | Text shown while flashing on completion. |

## Examples

### Small card with custom message

```yaml
type: custom:ha-visual-timer-card
entity: timer.tea_steep
size: S
completion_text: Steeped!
```

### Large card, no completion flash

```yaml
type: custom:ha-visual-timer-card
entity: timer.oven
size: L
flash_duration_minutes: 0
```

## How the countdown unit is chosen

The card picks the unit based on remaining seconds at the moment of render:

| Remaining (s) | Unit | Example |
| --- | --- | --- |
| > 7200 (> 120 min) | `h` | `3h` |
| > 120 (> 2 min) | `m` | `5m` |
| ≤ 120 | `s` | `45s` |

Values are rounded to the nearest whole unit (half rounds up).

## Troubleshooting

**The card says "Entity not found"** — Make sure the entity ID starts with `timer.` and exists in *Developer Tools → States*.

**Nothing updates** — Check the browser console. The card logs its version on load (`Visual Timer Card v…`). If you don't see it, the resource isn't loaded. Re-check the resource URL.

**It shows 0s and doesn't count down** — The timer entity must be `active` (started). Use the `timer.start` service to kick it off.

## Development

```bash
npm install
npm test          # run tests
npm run build     # produce dist/ha-visual-timer-card.js
npm run watch     # rebuild on change
```

Releases are cut by pushing a tag matching `v*` (e.g. `v0.1.0`). The release workflow runs tests, builds, and attaches the minified JS to the GitHub Release — which is what HACS serves.

## Contributing

Issues and PRs welcome. Please run `npm test` before submitting.

## License

MIT — see [LICENSE](LICENSE).
