/**
 * 复利计算器单元测试
 */

import { describe, test, expect } from 'vitest';
import { calculateFutureValue, calculatePrincipal, calculateInterestRate } from '../src/math/compound-interest';
import { FVInput } from '../src/types';

describe('复利计算器', () => {
  describe('calculateFutureValue', () => {
    test('简单的复利计算', () => {
      const input: FVInput = {
        P: 10000,
        r: 10,
        n: 5,
        mode: 'compound'
      };

      const result = calculateFutureValue(input);
      
      expect(result.success).toBe(true);
      if (result.success) {
        // 10000 * (1.1)^5 = 16105.1
        expect(result.data?.FV).toBeCloseTo(16105.1, 1);
        expect(result.data?.profit).toBeCloseTo(6105.1, 1);
      }
    });

    test('简单的单利计算', () => {
      const input: FVInput = {
        P: 10000,
        r: 10,
        n: 5,
        mode: 'simple'
      };

      const result = calculateFutureValue(input);
      
      expect(result.success).toBe(true);
      if (result.success) {
        // 10000 * (1 + 0.1 * 5) = 15000
        expect(result.data?.FV).toBe(15000);
        expect(result.data?.profit).toBe(5000);
      }
    });

    test('零收益率情况', () => {
      const input: FVInput = {
        P: 10000,
        r: 0,
        n: 5,
        mode: 'compound'
      };

      const result = calculateFutureValue(input);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.FV).toBe(10000);
        expect(result.data?.profit).toBe(0);
      }
    });

    test('负收益率情况 (-50%)', () => {
      const input: FVInput = {
        P: 10000,
        r: -50,
        n: 2,
        mode: 'compound'
      };

      const result = calculateFutureValue(input);
      
      expect(result.success).toBe(true);
      if (result.success) {
        // 10000 * (0.5)^2 = 2500
        expect(result.data?.FV).toBe(2500);
        expect(result.data?.profit).toBe(-7500);
      }
    });

    test('边界情况：-100%收益率应该失败', () => {
      const input: FVInput = {
        P: 10000,
        r: -100,
        n: 1,
        mode: 'compound'
      };

      const result = calculateFutureValue(input);
      
      expect(result.success).toBe(false);
      expect(result.error?.field).toBe('r');
    });

    test('小数年限计算', () => {
      const input: FVInput = {
        P: 10000,
        r: 10,
        n: 0.5,
        mode: 'compound'
      };

      const result = calculateFutureValue(input);
      
      expect(result.success).toBe(true);
      if (result.success) {
        // 10000 * (1.1)^0.5 ≈ 10488.09
        expect(result.data?.FV).toBeCloseTo(10488.09, 2);
      }
    });

    test('输入验证：负本金', () => {
      const input: FVInput = {
        P: -1000,
        r: 10,
        n: 5,
        mode: 'compound'
      };

      const result = calculateFutureValue(input);
      
      expect(result.success).toBe(false);
      expect(result.error?.field).toBe('本金');
    });

    test('输入验证：无效模式', () => {
      const input = {
        P: 10000,
        r: 10,
        n: 5,
        mode: 'invalid'
      } as FVInput;

      const result = calculateFutureValue(input);
      
      expect(result.success).toBe(false);
      expect(result.error?.field).toBe('mode');
    });

    test('与Excel FV函数对比 - 复利', () => {
      // Excel: =FV(10%, 10, 0, -10000) = 25937.42
      const input: FVInput = {
        P: 10000,
        r: 10,
        n: 10,
        mode: 'compound'
      };

      const result = calculateFutureValue(input);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.FV).toBeCloseTo(25937.42, 0.01);
      }
    });
  });

  describe('calculatePrincipal', () => {
    test('反向计算本金 - 复利', () => {
      const result = calculatePrincipal(16105.1, 10, 5, 'compound');
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.P).toBeCloseTo(10000, 1);
      }
    });

    test('反向计算本金 - 单利', () => {
      const result = calculatePrincipal(15000, 10, 5, 'simple');
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.P).toBe(10000);
      }
    });
  });

  describe('calculateInterestRate', () => {
    test('反向计算利率 - 复利', () => {
      const result = calculateInterestRate(16105.1, 10000, 5, 'compound');
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.r).toBeCloseTo(10, 0.01);
      }
    });

    test('反向计算利率 - 单利', () => {
      const result = calculateInterestRate(15000, 10000, 5, 'simple');
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.r).toBe(10);
      }
    });
  });
});
