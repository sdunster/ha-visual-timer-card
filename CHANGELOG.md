# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.1] - 2026-04-18

### Fixed
- Arc circle now renders correctly in Safari and Chrome (was using HTML namespace instead of SVG namespace, causing the progress arc to be invisible).
- XL size (600px) added.
- CI pipeline updated to handle cross-platform npm lockfile differences.

## [0.1.0] - 2026-04-17

### Added
- Circular timer card tracking a `timer.*` entity.
- Auto unit selection: hours (> 120 min), minutes (> 120 s), seconds otherwise.
- Configurable completion flash with custom text.
- Four fixed sizes: S (150px), M (250px), L (400px), XL (600px).
- Visual configuration editor.
- HACS metadata and release automation.
