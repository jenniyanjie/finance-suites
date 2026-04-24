import { describe, it, expect } from 'vitest';
import { calculateDCA } from '../src/math/dca';

describe('calculateDCA', () => {
  // ── 基本线性模式 ──────────────────────────────────────────────────────────
  describe('linear 模式', () => {
    it('价格不变时：定投 = 一次性投入，均摊成本 = 价格', () => {
      // 每期 1000，价格固定 10，投 12 期
      const res = calculateDCA({
        monthlyAmount: 1000,
        initialPrice: 10,
        finalPrice: 10,
        periods: 12,
        priceMode: 'linear',
      });
      expect(res.success).toBe(true);
      const d = res.data!;
      expect(d.totalInvested).toBe(12000);
      expect(d.avgCost).toBeCloseTo(10, 1);
      // 终期市值 = 1200 shares × 10 = 12000
      expect(d.finalValue).toBeCloseTo(12000, 0);
      expect(d.profit).toBeCloseTo(0, 0);
    });

    it('价格上涨时：定投收益为正', () => {
      const res = calculateDCA({
        monthlyAmount: 1000,
        initialPrice: 10,
        finalPrice: 20,
        periods: 12,
        priceMode: 'linear',
      });
      expect(res.success).toBe(true);
      expect(res.data!.profit).toBeGreaterThan(0);
      expect(res.data!.totalReturn).toBeGreaterThan(0);
    });

    it('价格下跌时：定投亏损', () => {
      const res = calculateDCA({
        monthlyAmount: 1000,
        initialPrice: 20,
        finalPrice: 10,
        periods: 12,
        priceMode: 'linear',
      });
      expect(res.success).toBe(true);
      expect(res.data!.profit).toBeLessThan(0);
    });

    it('价格上涨时：定投均摊成本 < 一次性均摊成本（摊低效果）', () => {
      // 价格线性从10涨到20，定投会在低价时买更多
      const res = calculateDCA({
        monthlyAmount: 1000,
        initialPrice: 10,
        finalPrice: 20,
        periods: 12,
        priceMode: 'linear',
      });
      expect(res.success).toBe(true);
      const d = res.data!;
      // DCA 平均成本应低于算数平均 (10+20)/2=15
      expect(d.avgCost).toBeLessThan(15);
    });

    it('价格下跌时：定投均摊成本 < 一次性投入成本（定投优于一次性）', () => {
      const res = calculateDCA({
        monthlyAmount: 1000,
        initialPrice: 20,
        finalPrice: 10,
        periods: 12,
        priceMode: 'linear',
      });
      expect(res.success).toBe(true);
      const d = res.data!;
      // 定投亏损应小于一次性投入的亏损
      expect(d.profit).toBeGreaterThan(d.lumpSum.profit);
    });

    it('总投入 = monthlyAmount × periods', () => {
      const res = calculateDCA({
        monthlyAmount: 500,
        initialPrice: 50,
        finalPrice: 80,
        periods: 24,
        priceMode: 'linear',
      });
      expect(res.success).toBe(true);
      expect(res.data!.totalInvested).toBe(12000);
    });

    it('单期：定投 = 一次性投入', () => {
      const res = calculateDCA({
        monthlyAmount: 1000,
        initialPrice: 10,
        finalPrice: 10,
        periods: 1,
        priceMode: 'linear',
      });
      expect(res.success).toBe(true);
      const d = res.data!;
      expect(d.totalShares).toBeCloseTo(d.lumpSum.shares, 4);
    });

    it('每期明细数量 = periods', () => {
      const res = calculateDCA({
        monthlyAmount: 1000,
        initialPrice: 10,
        finalPrice: 15,
        periods: 6,
        priceMode: 'linear',
      });
      expect(res.success).toBe(true);
      expect(res.data!.periodDetails).toHaveLength(6);
    });

    it('最后一期 totalInvested = totalInvested', () => {
      const res = calculateDCA({
        monthlyAmount: 1000,
        initialPrice: 10,
        finalPrice: 15,
        periods: 6,
        priceMode: 'linear',
      });
      expect(res.success).toBe(true);
      const d = res.data!;
      const lastPeriod = d.periodDetails[d.periodDetails.length - 1];
      expect(lastPeriod.totalInvested).toBe(d.totalInvested);
    });
  });

  // ── volatile 模式 ─────────────────────────────────────────────────────────
  describe('volatile 模式', () => {
    it('总投入仍然 = monthlyAmount × periods', () => {
      const res = calculateDCA({
        monthlyAmount: 1000,
        initialPrice: 10,
        finalPrice: 15,
        periods: 12,
        priceMode: 'volatile',
        volatility: 20,
      });
      expect(res.success).toBe(true);
      expect(res.data!.totalInvested).toBe(12000);
    });

    it('确定性：相同参数产生相同结果', () => {
      const input = {
        monthlyAmount: 1000,
        initialPrice: 10,
        finalPrice: 15,
        periods: 12,
        priceMode: 'volatile' as const,
        volatility: 30,
      };
      const res1 = calculateDCA(input);
      const res2 = calculateDCA(input);
      expect(res1.data!.totalShares).toBe(res2.data!.totalShares);
      expect(res1.data!.avgCost).toBe(res2.data!.avgCost);
    });

    it('最后一期价格 = finalPrice', () => {
      const res = calculateDCA({
        monthlyAmount: 1000,
        initialPrice: 10,
        finalPrice: 18,
        periods: 12,
        priceMode: 'volatile',
        volatility: 25,
      });
      expect(res.success).toBe(true);
      const lastDetail = res.data!.periodDetails[11];
      expect(lastDetail.price).toBe(18);
    });
  });

  // ── 一次性投入对比 ────────────────────────────────────────────────────────
  describe('lumpSum 对比', () => {
    it('lumpSum shares = totalInvested / initialPrice', () => {
      const res = calculateDCA({
        monthlyAmount: 1000,
        initialPrice: 10,
        finalPrice: 20,
        periods: 12,
        priceMode: 'linear',
      });
      expect(res.success).toBe(true);
      const d = res.data!;
      expect(d.lumpSum.shares).toBeCloseTo(d.totalInvested / 10, 3);
    });

    it('价格大幅上涨时：一次性投入收益 > 定投收益', () => {
      // 大幅上涨：在初始低价全押获益更大
      const res = calculateDCA({
        monthlyAmount: 1000,
        initialPrice: 10,
        finalPrice: 100,  // 10倍上涨
        periods: 12,
        priceMode: 'linear',
      });
      expect(res.success).toBe(true);
      const d = res.data!;
      expect(d.lumpSum.profit).toBeGreaterThan(d.profit);
    });
  });

  // ── 输入校验 ──────────────────────────────────────────────────────────────
  describe('输入校验', () => {
    it('每期金额为0时返回错误', () => {
      const res = calculateDCA({
        monthlyAmount: 0,
        initialPrice: 10,
        finalPrice: 15,
        periods: 12,
        priceMode: 'linear',
      });
      expect(res.success).toBe(false);
    });

    it('初始价格为0时返回错误', () => {
      const res = calculateDCA({
        monthlyAmount: 1000,
        initialPrice: 0,
        finalPrice: 15,
        periods: 12,
        priceMode: 'linear',
      });
      expect(res.success).toBe(false);
    });

    it('期数超过600时返回错误', () => {
      const res = calculateDCA({
        monthlyAmount: 1000,
        initialPrice: 10,
        finalPrice: 15,
        periods: 601,
        priceMode: 'linear',
      });
      expect(res.success).toBe(false);
    });
  });
});
