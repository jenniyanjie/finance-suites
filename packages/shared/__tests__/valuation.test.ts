/**
 * 估值工具单元测试
 */

import { describe, test, expect } from 'vitest';
import { calculatePEValuation, calculateDCF } from '../src/math/valuation';
import { PEInput, DCFInput } from '../src/types';

// ─── PE估值 ──────────────────────────────────────────────────────────────────

describe('calculatePEValuation', () => {
  test('三档目标价计算正确', () => {
    const input: PEInput = {
      EPS: 5.0,
      targetPE: { pessimistic: 10, neutral: 15, optimistic: 20 },
      safetyMargin: 20,
    };
    const result = calculatePEValuation(input);

    expect(result.success).toBe(true);
    if (result.success && result.data) {
      expect(result.data.targetPriceRange.pessimistic).toBe(50);   // 5 × 10
      expect(result.data.targetPriceRange.neutral).toBe(75);       // 5 × 15
      expect(result.data.targetPriceRange.optimistic).toBe(100);   // 5 × 20
      expect(result.data.suggestedBuyPrice).toBe(60);              // 75 × 0.8
    }
  });

  test('安全边际为0时建议买入价等于中性目标价', () => {
    const input: PEInput = {
      EPS: 4.0,
      targetPE: { pessimistic: 8, neutral: 12, optimistic: 16 },
      safetyMargin: 0,
    };
    const result = calculatePEValuation(input);

    expect(result.success).toBe(true);
    if (result.success && result.data) {
      expect(result.data.suggestedBuyPrice).toBe(result.data.targetPriceRange.neutral);
    }
  });

  test('悲观PE大于中性PE时返回错误', () => {
    const input: PEInput = {
      EPS: 3.0,
      targetPE: { pessimistic: 20, neutral: 15, optimistic: 25 }, // 悲观 > 中性
      safetyMargin: 10,
    };
    const result = calculatePEValuation(input);
    expect(result.success).toBe(false);
    expect(result.error?.field).toBe('悲观PE');
  });

  test('中性PE大于乐观PE时返回错误', () => {
    const input: PEInput = {
      EPS: 3.0,
      targetPE: { pessimistic: 10, neutral: 25, optimistic: 20 }, // 中性 > 乐观
      safetyMargin: 10,
    };
    const result = calculatePEValuation(input);
    expect(result.success).toBe(false);
  });

  test('EPS为负时返回错误', () => {
    const input: PEInput = {
      EPS: -1,
      targetPE: { pessimistic: 10, neutral: 15, optimistic: 20 },
      safetyMargin: 20,
    };
    const result = calculatePEValuation(input);
    expect(result.success).toBe(false);
  });
});

// ─── DCF估值 ─────────────────────────────────────────────────────────────────

describe('calculateDCF', () => {
  test('戈登模型终值 - 基本估值计算', () => {
    const input: DCFInput = {
      FCF0: 100,
      g: 10,
      r: 12,
      n: 5,
      terminalValue: { type: 'gordon', value: 3 }, // 3%永续增长
    };
    const result = calculateDCF(input);

    expect(result.success).toBe(true);
    if (result.success && result.data) {
      expect(result.data.valuation).toBeGreaterThan(0);
      expect(result.data.cashFlowDetails).toHaveLength(5);
      expect(result.data.terminalValue).toBeGreaterThan(0);
      // 第1年FCF应为FCF0*(1+10%) = 110
      expect(result.data.cashFlowDetails[0].cashFlow).toBeCloseTo(110, 2);
    }
  });

  test('退出倍数终值计算', () => {
    const input: DCFInput = {
      FCF0: 200,
      g: 8,
      r: 10,
      n: 10,
      terminalValue: { type: 'multiple', value: 15 }, // 15x退出倍数
    };
    const result = calculateDCF(input);

    expect(result.success).toBe(true);
    if (result.success && result.data) {
      expect(result.data.valuation).toBeGreaterThan(0);
      expect(result.data.cashFlowDetails).toHaveLength(10);
      // 终值 = FCF_10 × 15
      const fcf10 = 200 * Math.pow(1.08, 10);
      expect(result.data.terminalValue).toBeCloseTo(fcf10 * 15, 0);
    }
  });

  test('每年现金流按增长率递增', () => {
    const input: DCFInput = {
      FCF0: 100,
      g: 10,
      r: 15,
      n: 3,
      terminalValue: { type: 'multiple', value: 10 },
    };
    const result = calculateDCF(input);

    expect(result.success).toBe(true);
    if (result.success && result.data) {
      const details = result.data.cashFlowDetails;
      expect(details[1].cashFlow).toBeGreaterThan(details[0].cashFlow);
      expect(details[2].cashFlow).toBeGreaterThan(details[1].cashFlow);
    }
  });

  test('折现后现值逐年下降（增长率 < 折现率）', () => {
    const input: DCFInput = {
      FCF0: 100,
      g: 5,
      r: 15,
      n: 5,
      terminalValue: { type: 'multiple', value: 10 },
    };
    const result = calculateDCF(input);

    expect(result.success).toBe(true);
    if (result.success && result.data) {
      const details = result.data.cashFlowDetails;
      for (let i = 1; i < details.length; i++) {
        expect(details[i].presentValue).toBeLessThan(details[i - 1].presentValue);
      }
    }
  });

  test('永续增长率 >= 折现率时返回错误', () => {
    const input: DCFInput = {
      FCF0: 100,
      g: 10,
      r: 12,
      n: 5,
      terminalValue: { type: 'gordon', value: 12 }, // 永续增长率 = 折现率
    };
    const result = calculateDCF(input);
    expect(result.success).toBe(false);
    expect(result.error?.field).toBe('永续增长率');
  });

  test('FCF0为负时返回错误', () => {
    const input: DCFInput = {
      FCF0: -50,
      g: 10,
      r: 12,
      n: 5,
      terminalValue: { type: 'gordon', value: 3 },
    };
    const result = calculateDCF(input);
    expect(result.success).toBe(false);
  });

  test('折现率为0时返回错误', () => {
    const input: DCFInput = {
      FCF0: 100,
      g: 5,
      r: 0,
      n: 5,
      terminalValue: { type: 'multiple', value: 10 },
    };
    const result = calculateDCF(input);
    expect(result.success).toBe(false);
  });
});
