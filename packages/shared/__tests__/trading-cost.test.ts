/**
 * 港股交易费用计算器单元测试
 */

import { describe, test, expect } from 'vitest';
import { calculateTradingCost, getDefaultTradingRates } from '../src/math/trading-cost';
import { TradingCostInput } from '../src/types';

describe('港股交易费用计算器', () => {
  describe('calculateTradingCost', () => {
    test('标准IBKR港股交易费用计算', () => {
      const input: TradingCostInput = {
        buyPrice: 9.52,
        sellPrice: 9.70,
        shares: 20000,
        commissionRate: 0.05,
        minCommission: 18,
        stampDuty: 0.1,
        exchangeFee: 0.00565,
        clearingFee: 0.002,
        sfcFee: 0.0027,
        frcFee: 0.00015
      };

      const result = calculateTradingCost(input);
      
      expect(result.success).toBe(true);
      if (result.success && result.data) {
        const { buyBreakdown, sellBreakdown, totalCost, totalRevenue, netProfit, roi } = result.data;
        
        // 验证买入费用计算
        expect(buyBreakdown.amount).toBe(190400); // 9.52 * 20000
        expect(buyBreakdown.commission).toBeCloseTo(95.2, 2); // max(190400 * 0.0005, 18) = 95.2
        expect(buyBreakdown.stamp).toBe(191); // ceil(190400 * 0.001) = 191
        expect(buyBreakdown.exchangeFee).toBeCloseTo(10.76, 2); // 190400 * 0.0000565
        expect(buyBreakdown.clearingFee).toBeCloseTo(3.81, 2); // max(190400 * 0.00002, 2) = 3.81
        expect(buyBreakdown.sfcFee).toBeCloseTo(5.14, 2); // 190400 * 0.000027
        expect(buyBreakdown.frcFee).toBeCloseTo(0.29, 2); // 190400 * 0.0000015
        
        // 验证卖出费用计算
        expect(sellBreakdown.amount).toBe(194000); // 9.70 * 20000
        expect(sellBreakdown.commission).toBeCloseTo(97, 2); // max(194000 * 0.0005, 18) = 97
        expect(sellBreakdown.stamp).toBe(194); // ceil(194000 * 0.001) = ceil(194.0) = 194
        
        // 验证总成本和净收益
        expect(totalCost).toBeGreaterThan(190400); // 买入金额 + 买入费用
        expect(totalRevenue).toBeLessThan(194000); // 卖出金额 - 卖出费用
        expect(netProfit).toBeCloseTo(totalRevenue - totalCost, 2);
        expect(roi).toBeCloseTo((netProfit / totalCost) * 100, 2);
      }
    });

    test('小额交易触发最低佣金', () => {
      const input: TradingCostInput = {
        buyPrice: 1.0,
        sellPrice: 1.1,
        shares: 100,
        commissionRate: 0.05,
        minCommission: 18,
        stampDuty: 0.1,
        exchangeFee: 0.00565,
        clearingFee: 0.002,
        sfcFee: 0.0027,
        frcFee: 0.00015
      };

      const result = calculateTradingCost(input);
      
      expect(result.success).toBe(true);
      if (result.success && result.data) {
        // 小额交易应该触发最低佣金
        expect(result.data.buyBreakdown.commission).toBe(18);
        expect(result.data.sellBreakdown.commission).toBe(18);
      }
    });

    test('清算费最低金额测试', () => {
      const input: TradingCostInput = {
        buyPrice: 1.0,
        sellPrice: 1.0,
        shares: 100,
        commissionRate: 0.05,
        minCommission: 18,
        stampDuty: 0.1,
        exchangeFee: 0.00565,
        clearingFee: 0.002,
        sfcFee: 0.0027,
        frcFee: 0.00015
      };

      const result = calculateTradingCost(input);
      
      expect(result.success).toBe(true);
      if (result.success && result.data) {
        // 清算费应该是最低2HKD（因为100 * 0.002% = 0.002 < 2）
        expect(result.data.buyBreakdown.clearingFee).toBe(2);
        expect(result.data.sellBreakdown.clearingFee).toBe(2);
      }
    });

    test('印花税向上取整测试', () => {
      const input: TradingCostInput = {
        buyPrice: 10.555, // 故意选择会产生小数印花税的价格
        sellPrice: 10.555,
        shares: 100,
        commissionRate: 0.05,
        minCommission: 18,
        stampDuty: 0.1,
        exchangeFee: 0.00565,
        clearingFee: 0.002,
        sfcFee: 0.0027,
        frcFee: 0.00015
      };

      const result = calculateTradingCost(input);
      
      expect(result.success).toBe(true);
      if (result.success && result.data) {
        const expectedStamp = Math.ceil(1055.5 * 0.001); // ceil(1.0555) = 2
        expect(result.data.buyBreakdown.stamp).toBe(expectedStamp);
        expect(result.data.sellBreakdown.stamp).toBe(expectedStamp);
      }
    });

    test('输入验证：负价格', () => {
      const input: TradingCostInput = {
        buyPrice: -1,
        sellPrice: 10,
        shares: 100,
        commissionRate: 0.05,
        minCommission: 18,
        stampDuty: 0.1,
        exchangeFee: 0.00565,
        clearingFee: 0.002,
        sfcFee: 0.0027,
        frcFee: 0.00015
      };

      const result = calculateTradingCost(input);
      
      expect(result.success).toBe(false);
      expect(result.error?.field).toBe('买入价');
    });

    test('输入验证：零股数', () => {
      const input: TradingCostInput = {
        buyPrice: 10,
        sellPrice: 10,
        shares: 0,
        commissionRate: 0.05,
        minCommission: 18,
        stampDuty: 0.1,
        exchangeFee: 0.00565,
        clearingFee: 0.002,
        sfcFee: 0.0027,
        frcFee: 0.00015
      };

      const result = calculateTradingCost(input);
      
      expect(result.success).toBe(false);
      expect(result.error?.field).toBe('股数');
    });

    test('输入验证：过高费率', () => {
      const input: TradingCostInput = {
        buyPrice: 10,
        sellPrice: 10,
        shares: 100,
        commissionRate: 150, // 过高的佣金率
        minCommission: 18,
        stampDuty: 0.1,
        exchangeFee: 0.00565,
        clearingFee: 0.002,
        sfcFee: 0.0027,
        frcFee: 0.00015
      };

      const result = calculateTradingCost(input);
      
      expect(result.success).toBe(false);
      expect(result.error?.field).toBe('佣金率');
    });

    test('亏损交易计算', () => {
      const input: TradingCostInput = {
        buyPrice: 10.0,
        sellPrice: 9.0, // 亏损10%
        shares: 1000,
        commissionRate: 0.05,
        minCommission: 18,
        stampDuty: 0.1,
        exchangeFee: 0.00565,
        clearingFee: 0.002,
        sfcFee: 0.0027,
        frcFee: 0.00015
      };

      const result = calculateTradingCost(input);
      
      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect(result.data.netProfit).toBeLessThan(0); // 应该是亏损
        expect(result.data.roi).toBeLessThan(0); // ROI应该是负数
      }
    });

    test('股数自动向下取整', () => {
      const input: TradingCostInput = {
        buyPrice: 10.0,
        sellPrice: 10.5,
        shares: 1000.7, // 非整数股数
        commissionRate: 0.05,
        minCommission: 18,
        stampDuty: 0.1,
        exchangeFee: 0.00565,
        clearingFee: 0.002,
        sfcFee: 0.0027,
        frcFee: 0.00015
      };

      const result = calculateTradingCost(input);
      
      expect(result.success).toBe(true);
      if (result.success && result.data) {
        // 交易金额应该按照1000股计算，而不是1000.7股
        expect(result.data.buyBreakdown.amount).toBe(10000); // 10.0 * 1000
        expect(result.data.sellBreakdown.amount).toBe(10500); // 10.5 * 1000
      }
    });
  });

  describe('getDefaultTradingRates', () => {
    test('返回IBKR默认费率配置', () => {
      const defaultRates = getDefaultTradingRates();
      
      expect(defaultRates.commissionRate).toBe(0.05);
      expect(defaultRates.minCommission).toBe(18);
      expect(defaultRates.stampDuty).toBe(0.1);
      expect(defaultRates.exchangeFee).toBe(0.00565);
      expect(defaultRates.clearingFee).toBe(0.002);
      expect(defaultRates.sfcFee).toBe(0.0027);
      expect(defaultRates.frcFee).toBe(0.00015);
    });
  });
});


