import { describe, it, expect } from 'vitest';
import { circumference, dashOffset, progressFromTimes } from '../src/arc-geometry';

describe('circumference', () => {
  it('computes 2*pi*r', () => {
    expect(circumference(100)).toBeCloseTo(2 * Math.PI * 100, 5);
  });
  it('is 0 for radius 0', () => {
    expect(circumference(0)).toBe(0);
  });
});

describe('dashOffset', () => {
  const r = 100;
  const c = 2 * Math.PI * r;

  it('is 0 when progress=1 (full arc)', () => {
    expect(dashOffset(r, 1)).toBeCloseTo(0, 5);
  });
  it('is full circumference when progress=0 (empty)', () => {
    expect(dashOffset(r, 0)).toBeCloseTo(c, 5);
  });
  it('is half circumference at progress=0.5', () => {
    expect(dashOffset(r, 0.5)).toBeCloseTo(c / 2, 5);
  });
  it('clamps progress > 1 to 1', () => {
    expect(dashOffset(r, 1.5)).toBeCloseTo(0, 5);
  });
  it('clamps progress < 0 to 0', () => {
    expect(dashOffset(r, -0.5)).toBeCloseTo(c, 5);
  });
});

describe('progressFromTimes', () => {
  it('returns 1 when remaining=duration', () => {
    expect(progressFromTimes(300, 300)).toBe(1);
  });
  it('returns 0 when remaining=0', () => {
    expect(progressFromTimes(0, 300)).toBe(0);
  });
  it('returns 0.5 at half', () => {
    expect(progressFromTimes(150, 300)).toBe(0.5);
  });
  it('clamps overshoot to 1', () => {
    expect(progressFromTimes(400, 300)).toBe(1);
  });
  it('returns 0 for 0 duration (guards divide by zero)', () => {
    expect(progressFromTimes(10, 0)).toBe(0);
  });
  it('returns 0 for negative duration', () => {
    expect(progressFromTimes(10, -5)).toBe(0);
  });
});
