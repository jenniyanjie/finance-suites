import { describe, it, expect } from 'vitest';
import { calculateKellyPosition, calculateExpectancy } from '../src/math/kelly';

// ─── calculateKellyPosition ──────────────────────────────────────────────────

describe('calculateKellyPosition', () => {
  it('calculates correct Kelly fraction for a classic 50/50 coin flip with 2:1 payout', () => {
    // f* = (2*0.5 - 0.5) / 2 = 0.25
    const result = calculateKellyPosition({ p: 0.5, b: 2 });
    expect(result.success).toBe(true);
    expect(result.data?.kellyPosition).toBeCloseTo(0.25, 4);
  });

  it('flags isHighRisk = false when Kelly <= 0.25', () => {
    const result = calculateKellyPosition({ p: 0.5, b: 2 });
    expect(result.data?.isHighRisk).toBe(false);
  });

  it('flags isHighRisk = true when Kelly > 0.25', () => {
    // f* = (3*0.6 - 0.4) / 3 = (1.8-0.4)/3 = 0.467
    const result = calculateKellyPosition({ p: 0.6, b: 3 });
    expect(result.data?.isHighRisk).toBe(true);
  });

  it('returns error for negative expected value (Kelly <= 0)', () => {
    // p=0.3, b=1 → f* = (1*0.3 - 0.7)/1 = -0.4
    const result = calculateKellyPosition({ p: 0.3, b: 1 });
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('VALIDATION_ERROR');
  });

  it('returns error when p = 0', () => {
    const result = calculateKellyPosition({ p: 0, b: 2 });
    expect(result.success).toBe(false);
  });

  it('calculates suggestedRange when maxDrawdown is provided', () => {
    const result = calculateKellyPosition({ p: 0.5, b: 2, maxDrawdown: 20 });
    expect(result.success).toBe(true);
    expect(result.data?.suggestedRange).toBeDefined();
    const { min, max } = result.data!.suggestedRange!;
    expect(min).toBeGreaterThan(0);
    expect(max).toBeGreaterThan(min);
    // max should not exceed half-Kelly (0.125)
    expect(max).toBeLessThanOrEqual(0.125 + 0.0001);
  });

  it('omits suggestedRange when maxDrawdown is not provided', () => {
    const result = calculateKellyPosition({ p: 0.55, b: 1.5 });
    expect(result.data?.suggestedRange).toBeUndefined();
  });

  it('handles high win-rate scenario correctly', () => {
    // p=0.8, b=1 → f* = (1*0.8 - 0.2)/1 = 0.6
    const result = calculateKellyPosition({ p: 0.8, b: 1 });
    expect(result.success).toBe(true);
    expect(result.data?.kellyPosition).toBeCloseTo(0.6, 4);
    expect(result.data?.isHighRisk).toBe(true);
  });
});

// ─── calculateExpectancy ─────────────────────────────────────────────────────

describe('calculateExpectancy', () => {
  it('computes positive expectancy correctly', () => {
    // ratio = 0.5*2 - 0.5 = 0.5; per trade = 0.5 * 1000 = 500
    const result = calculateExpectancy(0.5, 2, 1000);
    expect(result.success).toBe(true);
    expect(result.data?.expectancyRatio).toBeCloseTo(0.5, 4);
    expect(result.data?.expectancyPerTrade).toBeCloseTo(500, 2);
  });

  it('computes negative expectancy correctly', () => {
    // p=0.3, b=1 → ratio = 0.3*1 - 0.7 = -0.4
    const result = calculateExpectancy(0.3, 1, 1000);
    expect(result.success).toBe(true);
    expect(result.data?.expectancyRatio).toBeCloseTo(-0.4, 4);
    expect(result.data?.expectancyPerTrade).toBeCloseTo(-400, 2);
  });

  it('returns error for invalid probability > 1', () => {
    const result = calculateExpectancy(1.5, 2, 1000);
    expect(result.success).toBe(false);
  });

  it('returns error for zero risk amount', () => {
    const result = calculateExpectancy(0.5, 2, 0);
    expect(result.success).toBe(false);
  });

  it('scales expectancyPerTrade linearly with riskAmount', () => {
    const r1 = calculateExpectancy(0.5, 2, 500);
    const r2 = calculateExpectancy(0.5, 2, 1000);
    expect(r2.data!.expectancyPerTrade).toBeCloseTo(r1.data!.expectancyPerTrade * 2, 2);
  });
});
