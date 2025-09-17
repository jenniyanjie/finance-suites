/**
 * CAGR计算器单元测试
 */

import { describe, test, expect } from 'vitest';
import { calculateCAGR, calculateTargetPrice, calculateRequiredTime, batchCalculateCAGR } from '../src/math/cagr';
import { CAGRInput } from '../src/types';

describe('CAGR计算器', () => {
  describe('calculateCAGR', () => {
    test('基本CAGR计算', () => {
      const input: CAGRInput = {
        buy: 100,
        sell: 200,
        years: 3
      };

      const result = calculateCAGR(input);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.total).toBeCloseTo(100, 2); // 100%总收益
        expect(result.data?.cagr).toBeCloseTo(25.99, 2); // 约26%年化收益
      }
    });

    test('亏损情况的CAGR计算', () => {
      const input: CAGRInput = {
        buy: 100,
        sell: 80,
        years: 2
      };

      const result = calculateCAGR(input);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.total).toBeCloseTo(-20, 2); // -20%总收益
        expect(result.data?.cagr).toBeCloseTo(-10.56, 2); // 约-10.56%年化收益
      }
    });

    test('持有时间小于1年', () => {
      const input: CAGRInput = {
        buy: 100,
        sell: 110,
        years: 0.5
      };

      const result = calculateCAGR(input);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.total).toBeCloseTo(10, 2); // 10%总收益
        expect(result.data?.cagr).toBeCloseTo(21, 2); // 约21%年化收益
      }
    });

    test('价格相等情况', () => {
      const input: CAGRInput = {
        buy: 100,
        sell: 100,
        years: 1
      };

      const result = calculateCAGR(input);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.total).toBe(0); // 0%收益
        expect(result.data?.cagr).toBe(0); // 0%年化收益
      }
    });

    test('输入验证：零买入价', () => {
      const input: CAGRInput = {
        buy: 0,
        sell: 100,
        years: 1
      };

      const result = calculateCAGR(input);
      
      expect(result.success).toBe(false);
      expect(result.error?.field).toBe('买入价');
    });

    test('输入验证：零持有时间', () => {
      const input: CAGRInput = {
        buy: 100,
        sell: 110,
        years: 0
      };

      const result = calculateCAGR(input);
      
      expect(result.success).toBe(false);
      expect(result.error?.field).toBe('持有年限');
    });

    test('与Excel XIRR近似比较', () => {
      // 模拟等间隔投资情况
      const input: CAGRInput = {
        buy: 1000,
        sell: 1331, // (1.1)^3 * 1000
        years: 3
      };

      const result = calculateCAGR(input);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.cagr).toBeCloseTo(10, 0.01); // 应该接近10%
      }
    });
  });

  describe('calculateTargetPrice', () => {
    test('基本目标价格计算', () => {
      const result = calculateTargetPrice(100, 10, 5);
      
      expect(result.success).toBe(true);
      if (result.success) {
        // 100 * (1.1)^5 = 161.05
        expect(result.data?.targetPrice).toBeCloseTo(161.05, 2);
      }
    });

    test('负CAGR目标价格', () => {
      const result = calculateTargetPrice(100, -10, 2);
      
      expect(result.success).toBe(true);
      if (result.success) {
        // 100 * (0.9)^2 = 81
        expect(result.data?.targetPrice).toBeCloseTo(81, 2);
      }
    });

    test('零CAGR目标价格', () => {
      const result = calculateTargetPrice(100, 0, 5);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.targetPrice).toBe(100);
      }
    });
  });

  describe('calculateRequiredTime', () => {
    test('基本所需时间计算', () => {
      const result = calculateRequiredTime(100, 200, 25.99);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.requiredYears).toBeCloseTo(3, 0.1);
      }
    });

    test('价格相等且CAGR为0', () => {
      const result = calculateRequiredTime(100, 100, 0);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.requiredYears).toBe(0);
      }
    });

    test('无法达到的目标 - 价格下跌但要求正收益', () => {
      const result = calculateRequiredTime(100, 80, 10);
      
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('无法达到目标CAGR');
    });

    test('输入验证：CAGR小于等于-100%', () => {
      const result = calculateRequiredTime(100, 200, -100);
      
      expect(result.success).toBe(false);
      expect(result.error?.field).toBe('目标CAGR');
    });
  });

  describe('batchCalculateCAGR', () => {
    test('批量计算多个投资', () => {
      const investments = [
        { name: '股票A', buy: 100, sell: 150, years: 2 },
        { name: '股票B', buy: 200, sell: 240, years: 1 },
        { name: '股票C', buy: 50, sell: 45, years: 0.5 }
      ];

      const result = batchCalculateCAGR(investments);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(3);
        
        // 股票A: 50%总收益, 约22.47%年化
        expect(result.data?.[0]?.total).toBeCloseTo(50, 2);
        expect(result.data?.[0]?.cagr).toBeCloseTo(22.47, 2);
        
        // 股票B: 20%总收益, 20%年化
        expect(result.data?.[1]?.total).toBeCloseTo(20, 2);
        expect(result.data?.[1]?.cagr).toBeCloseTo(20, 2);
        
        // 股票C: -10%总收益, 约-19%年化
        expect(result.data?.[2]?.total).toBeCloseTo(-10, 2);
        expect(result.data?.[2]?.cagr).toBeCloseTo(-19, 1);
      }
    });

    test('批量计算包含错误输入', () => {
      const investments = [
        { name: '正常股票', buy: 100, sell: 150, years: 2 },
        { name: '错误股票', buy: 0, sell: 100, years: 1 } // 买入价为0
      ];

      const result = batchCalculateCAGR(investments);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
        expect(result.data?.[0]?.error).toBeUndefined();
        expect(result.data?.[1]?.error).toBeDefined();
      }
    });
  });

  describe('边界情况和精度测试', () => {
    test('极小的时间间隔', () => {
      const input: CAGRInput = {
        buy: 100,
        sell: 101,
        years: 0.001 // 约8.76小时
      };

      const result = calculateCAGR(input);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.total).toBeCloseTo(1, 2);
        // 年化收益应该很高
        expect(result.data?.cagr).toBeGreaterThan(1000);
      }
    });

    test('大数值计算', () => {
      const input: CAGRInput = {
        buy: 1000000,
        sell: 5000000,
        years: 10
      };

      const result = calculateCAGR(input);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.total).toBe(400); // 400%总收益
        expect(result.data?.cagr).toBeCloseTo(17.46, 2); // 约17.46%年化
      }
    });
  });
});
