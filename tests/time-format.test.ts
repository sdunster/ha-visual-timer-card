import { describe, it, expect } from 'vitest';
import { parseHmsToSeconds, formatRemaining } from '../src/time-format';

describe('parseHmsToSeconds', () => {
  it('parses zero', () => {
    expect(parseHmsToSeconds('0:00:00')).toBe(0);
  });
  it('parses minutes', () => {
    expect(parseHmsToSeconds('0:05:00')).toBe(300);
  });
  it('parses hours/minutes/seconds', () => {
    expect(parseHmsToSeconds('1:23:45')).toBe(1 * 3600 + 23 * 60 + 45);
  });
  it('parses zero-padded hours', () => {
    expect(parseHmsToSeconds('02:00:00')).toBe(7200);
  });
  it('returns 0 for undefined/null/empty', () => {
    expect(parseHmsToSeconds(undefined)).toBe(0);
    expect(parseHmsToSeconds(null)).toBe(0);
    expect(parseHmsToSeconds('')).toBe(0);
  });
  it('returns 0 for malformed input', () => {
    expect(parseHmsToSeconds('abc')).toBe(0);
    expect(parseHmsToSeconds('1:2')).toBe(0);
  });
});

describe('formatRemaining', () => {
  it('shows seconds at 0', () => {
    expect(formatRemaining(0)).toEqual({ value: 0, unit: 's' });
  });
  it('shows seconds at 1', () => {
    expect(formatRemaining(1)).toEqual({ value: 1, unit: 's' });
  });
  it('shows seconds at 120 (boundary: not greater than)', () => {
    expect(formatRemaining(120)).toEqual({ value: 120, unit: 's' });
  });
  it('shows minutes just above 120s', () => {
    // 121s rounded / 60 = 2
    expect(formatRemaining(121)).toEqual({ value: 2, unit: 'm' });
  });
  it('shows minutes in the middle band', () => {
    expect(formatRemaining(300)).toEqual({ value: 5, unit: 'm' });
  });
  it('rounds minutes to nearest (half-up)', () => {
    // 5.5 minutes = 330s -> 6m
    expect(formatRemaining(330)).toEqual({ value: 6, unit: 'm' });
    // 5.49 minutes = 329.4s -> 5m
    expect(formatRemaining(329)).toEqual({ value: 5, unit: 'm' });
  });
  it('shows minutes at 7200s (boundary: not greater than)', () => {
    // 7200 / 60 = 120m (still minutes since 7200 is not > 7200)
    expect(formatRemaining(7200)).toEqual({ value: 120, unit: 'm' });
  });
  it('shows hours just above 7200s', () => {
    // 7201 / 3600 = 2.0003 -> 2h
    expect(formatRemaining(7201)).toEqual({ value: 2, unit: 'h' });
  });
  it('rounds hours to nearest', () => {
    // 2.5h = 9000s -> 3h (half-up)
    expect(formatRemaining(9000)).toEqual({ value: 3, unit: 'h' });
    // 2.49h ~= 8964s -> 2h
    expect(formatRemaining(8964)).toEqual({ value: 2, unit: 'h' });
  });
  it('clamps negative to 0', () => {
    expect(formatRemaining(-5)).toEqual({ value: 0, unit: 's' });
  });
  it('rounds seconds to nearest', () => {
    expect(formatRemaining(44.4)).toEqual({ value: 44, unit: 's' });
    expect(formatRemaining(44.5)).toEqual({ value: 45, unit: 's' });
  });
});
