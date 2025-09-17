/**
 * 房地产投资收益计算器单元测试
 */

import { describe, test, expect } from 'vitest';
import { calculateRealEstateReturn, calculateRequiredAppreciation, batchCompareRealestate } from '../src/math/real-estate';
import { RealEstateInput } from '../src/types';

describe('房地产投资收益计算器', () => {
  describe('calculateRealEstateReturn', () => {
    test('基本房地产投资收益计算', () => {
      const input: RealEstateInput = {
        propertyPrice: 600, // 600万
        leverageRatio: 0.6667, // 66.67%杠杆
        loanRate: 2, // 2%房贷利率
        rentYield: 3, // 3%租售比
        priceGrowth: 3, // 3%房价涨幅
      };

      const result = calculateRealEstateReturn(input);
      
      expect(result.success).toBe(true);
      if (result.success) {
        // 自有资金 = 600 × (1 - 0.6667) = 200万
        expect(result.data?.equity).toBeCloseTo(200, 0);
        
        // 贷款金额 = 600 × 0.6667 = 400万
        expect(result.data?.loan).toBeCloseTo(400, 0);
        
        // 年租金收入 = 600 × 3% = 18万
        expect(result.data?.rent).toBe(18);
        
        // 年利息支出 = 400 × 2% = 8万
        expect(result.data?.interest).toBe(8);
        
        // 年净租金收益 = 18 - 8 = 10万
        expect(result.data?.netRent).toBe(10);
        
        // 房价上涨收益 = 600 × 3% = 18万
        expect(result.data?.appreciation).toBe(18);
        
        // 年总收益 = 10 + 18 = 28万
        expect(result.data?.totalProfit).toBe(28);
        
        // ROE = 28 / 200 × 100% = 14%
        expect(result.data?.roe).toBe(14);
      }
    });

    test('全款买房 (无杠杆)', () => {
      const input: RealEstateInput = {
        propertyPrice: 600,
        leverageRatio: 0, // 无杠杆
        loanRate: 2,
        rentYield: 3,
        priceGrowth: 3,
      };

      const result = calculateRealEstateReturn(input);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.equity).toBe(600); // 自有资金 = 全价
        expect(result.data?.loan).toBe(0); // 无贷款
        expect(result.data?.interest).toBe(0); // 无利息
        expect(result.data?.netRent).toBe(18); // 净租金 = 租金
        expect(result.data?.roe).toBe(6); // ROE = (18 + 18) / 600 = 6%
      }
    });

    test('高杠杆投资', () => {
      const input: RealEstateInput = {
        propertyPrice: 600,
        leverageRatio: 0.8, // 80%杠杆
        loanRate: 3,
        rentYield: 4,
        priceGrowth: 5,
      };

      const result = calculateRealEstateReturn(input);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.equity).toBe(120); // 自有资金 = 600 × 0.2 = 120万
        expect(result.data?.loan).toBe(480); // 贷款 = 600 × 0.8 = 480万
        expect(result.data?.interest).toBe(14.4); // 利息 = 480 × 3% = 14.4万
        expect(result.data?.netRent).toBe(9.6); // 净租金 = 24 - 14.4 = 9.6万
        expect(result.data?.appreciation).toBe(30); // 涨幅收益 = 600 × 5% = 30万
        expect(result.data?.roe).toBe(33); // ROE = (9.6 + 30) / 120 = 33%
      }
    });

    test('负租金收益情况', () => {
      const input: RealEstateInput = {
        propertyPrice: 600,
        leverageRatio: 0.8,
        loanRate: 5, // 高利率
        rentYield: 2, // 低租售比
        priceGrowth: 1, // 低涨幅
      };

      const result = calculateRealEstateReturn(input);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.netRent).toBe(-12); // 12 - 24 = -12万 (负现金流)
        expect(result.data?.totalProfit).toBe(-6); // -12 + 6 = -6万
        expect(result.data?.roe).toBe(-5); // ROE为负
      }
    });

    test('输入验证：房价为负', () => {
      const input: RealEstateInput = {
        propertyPrice: -100,
        leverageRatio: 0.6,
        loanRate: 2,
        rentYield: 3,
        priceGrowth: 3,
      };

      const result = calculateRealEstateReturn(input);
      
      expect(result.success).toBe(false);
      expect(result.error?.field).toBe('房屋总价');
    });

    test('输入验证：杠杆比例超过1', () => {
      const input: RealEstateInput = {
        propertyPrice: 600,
        leverageRatio: 1.2, // 超过100%
        loanRate: 2,
        rentYield: 3,
        priceGrowth: 3,
      };

      const result = calculateRealEstateReturn(input);
      
      expect(result.success).toBe(false);
      expect(result.error?.field).toBe('杠杆比例');
    });

    test('边界情况：100%杠杆 (应失败)', () => {
      const input: RealEstateInput = {
        propertyPrice: 600,
        leverageRatio: 1.0, // 100%杠杆，无自有资金
        loanRate: 2,
        rentYield: 3,
        priceGrowth: 3,
      };

      const result = calculateRealEstateReturn(input);
      
      expect(result.success).toBe(false);
      expect(result.error?.field).toBe('杠杆比例');
    });
  });

  describe('calculateRequiredAppreciation', () => {
    test('反向计算所需房价涨幅', () => {
      const result = calculateRequiredAppreciation(600, 0.6667, 2, 3, 15); // 目标ROE 15%
      
      expect(result.success).toBe(true);
      if (result.success) {
        // 目标收益 = 200 × 15% = 30万
        // 净租金收益 = 10万
        // 所需房价上涨收益 = 30 - 10 = 20万
        // 所需房价涨幅 = 20 / 600 × 100% = 3.33%
        expect(result.data?.requiredPriceGrowth).toBeCloseTo(3.33, 2);
      }
    });

    test('负目标ROE情况', () => {
      const result = calculateRequiredAppreciation(600, 0.8, 5, 2, -5); // 目标ROE -5%
      
      expect(result.success).toBe(true);
      if (result.success) {
        // 在高杠杆和高利率情况下，即使负目标ROE也可能需要正涨幅
        expect(result.data?.requiredPriceGrowth).toBeDefined();
      }
    });
  });

  describe('batchCompareRealestate', () => {
    test('批量对比不同杠杆比例', () => {
      const baseInput = {
        propertyPrice: 600,
        loanRate: 2,
        rentYield: 3,
        priceGrowth: 3,
      };
      const leverageRatios = [0, 0.3, 0.6, 0.8];

      const result = batchCompareRealestate(baseInput, leverageRatios);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(4);
        
        // 验证杠杆效应：适度杠杆应该提高ROE
        const noLeverage = result.data?.find(r => r.leverageRatio === 0);
        const moderateLeverage = result.data?.find(r => r.leverageRatio === 0.6);
        
        expect(moderateLeverage?.roe).toBeGreaterThan(noLeverage?.roe || 0);
      }
    });

    test('批量对比包含错误输入', () => {
      const baseInput = {
        propertyPrice: 600,
        loanRate: 2,
        rentYield: 3,
        priceGrowth: 3,
      };
      const leverageRatios = [0.5, 1.2]; // 1.2超出范围

      const result = batchCompareRealestate(baseInput, leverageRatios);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.[0]?.error).toBeUndefined(); // 0.5正常
        expect(result.data?.[1]?.error).toBeDefined(); // 1.2有错误
      }
    });
  });

  describe('边界情况和精度测试', () => {
    test('极小房价', () => {
      const input: RealEstateInput = {
        propertyPrice: 0.01, // 极小值
        leverageRatio: 0.5,
        loanRate: 2,
        rentYield: 3,
        priceGrowth: 3,
      };

      const result = calculateRealEstateReturn(input);
      
      expect(result.success).toBe(true);
      if (result.success) {
        // 极小房价时杠杆效应更明显，ROE会更高
        expect(result.data?.roe).toBeCloseTo(10, 1);
      }
    });

    test('高房价计算', () => {
      const input: RealEstateInput = {
        propertyPrice: 50000, // 5亿（极高房价）
        leverageRatio: 0.7,
        loanRate: 2.5,
        rentYield: 2,
        priceGrowth: 4,
      };

      const result = calculateRealEstateReturn(input);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(isFinite(result.data?.roe)).toBe(true);
        expect(result.data?.totalProfit).toBeGreaterThan(0);
      }
    });
  });
});
