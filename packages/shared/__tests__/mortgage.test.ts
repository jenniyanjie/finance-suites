/**
 * 房贷计算器单元测试
 */

import { describe, test, expect } from 'vitest';
import { calculateMortgage } from '../src/math/mortgage';
import { MortgageInput } from '../src/types';

describe('calculateMortgage', () => {
  describe('等额本息 (annuity)', () => {
    test('标准30年期房贷月供计算', () => {
      const input: MortgageInput = {
        L: 1000000,
        r: 4.2,
        n: 30,
        method: 'annuity',
      };
      const result = calculateMortgage(input);

      expect(result.success).toBe(true);
      if (result.success && result.data) {
        // M = 1000000 * [0.0035*(1.0035)^360] / [(1.0035)^360 - 1] ≈ 4890
        expect(result.data.monthlyPayment).toBeCloseTo(4890, 0);
        expect(result.data.totalPayment).toBeGreaterThan(1000000);
        expect(result.data.totalInterest).toBeCloseTo(
          result.data.totalPayment - 1000000,
          2
        );
      }
    });

    test('摊还明细条目数与还款月数一致', () => {
      const input: MortgageInput = { L: 500000, r: 3.6, n: 20, method: 'annuity' };
      const result = calculateMortgage(input);

      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect(result.data.amortizationSchedule).toHaveLength(240); // 20年×12月
      }
    });

    test('最后一期余额应为0', () => {
      const input: MortgageInput = { L: 300000, r: 5.0, n: 10, method: 'annuity' };
      const result = calculateMortgage(input);

      expect(result.success).toBe(true);
      if (result.success && result.data) {
        const last = result.data.amortizationSchedule.at(-1)!;
        expect(last.balance).toBe(0);
      }
    });

    test('总支付 ≈ 首月月供 × 期数 (等额本息)', () => {
      const input: MortgageInput = { L: 200000, r: 4.5, n: 5, method: 'annuity' };
      const result = calculateMortgage(input);

      expect(result.success).toBe(true);
      if (result.success && result.data) {
        // 每月金额相同，总额近似 M×n×12
        const expectedTotal = result.data.monthlyPayment * 60;
        expect(result.data.totalPayment).toBeCloseTo(expectedTotal, 0);
      }
    });
  });

  describe('等额本金 (equal_principal)', () => {
    test('首月月供高于等额本息（同条件下）', () => {
      const base = { L: 1000000, r: 4.2, n: 30 };
      const annuityResult = calculateMortgage({ ...base, method: 'annuity' });
      const epResult = calculateMortgage({ ...base, method: 'equal_principal' });

      expect(annuityResult.success && epResult.success).toBe(true);
      if (annuityResult.data && epResult.data) {
        // 等额本金首月还款额 > 等额本息月供
        expect(epResult.data.monthlyPayment).toBeGreaterThan(
          annuityResult.data.monthlyPayment
        );
      }
    });

    test('等额本金总利息 < 等额本息总利息（同条件下）', () => {
      const base = { L: 1000000, r: 4.2, n: 30 };
      const annuityResult = calculateMortgage({ ...base, method: 'annuity' });
      const epResult = calculateMortgage({ ...base, method: 'equal_principal' });

      expect(annuityResult.success && epResult.success).toBe(true);
      if (annuityResult.data && epResult.data) {
        expect(epResult.data.totalInterest).toBeLessThan(
          annuityResult.data.totalInterest
        );
      }
    });

    test('摊还明细：每期本金相等', () => {
      const input: MortgageInput = { L: 120000, r: 4.0, n: 10, method: 'equal_principal' };
      const result = calculateMortgage(input);

      expect(result.success).toBe(true);
      if (result.success && result.data) {
        const principals = result.data.amortizationSchedule.map((r) => r.principal);
        const firstPrincipal = principals[0];
        // 所有月份本金应相等（允许浮点容差）
        principals.forEach((p) => {
          expect(p).toBeCloseTo(firstPrincipal, 2);
        });
      }
    });

    test('利息逐月递减', () => {
      const input: MortgageInput = { L: 600000, r: 5.0, n: 15, method: 'equal_principal' };
      const result = calculateMortgage(input);

      expect(result.success).toBe(true);
      if (result.success && result.data) {
        const schedule = result.data.amortizationSchedule;
        for (let i = 1; i < Math.min(12, schedule.length); i++) {
          expect(schedule[i].interest).toBeLessThan(schedule[i - 1].interest);
        }
      }
    });
  });

  describe('输入验证', () => {
    test('贷款额为0时返回错误', () => {
      const result = calculateMortgage({ L: 0, r: 4.2, n: 30, method: 'annuity' });
      expect(result.success).toBe(false);
      expect(result.error?.field).toBe('贷款额');
    });

    test('利率为0时返回错误', () => {
      const result = calculateMortgage({ L: 500000, r: 0, n: 20, method: 'annuity' });
      expect(result.success).toBe(false);
    });

    test('年限超过50时返回错误', () => {
      const result = calculateMortgage({ L: 500000, r: 4.0, n: 51, method: 'annuity' });
      expect(result.success).toBe(false);
    });
  });
});
