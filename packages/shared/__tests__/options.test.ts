import { describe, it, expect } from 'vitest';
import { calculateOptionPL, generateOptionPayoffCurve } from '../src/math/options';

describe('calculateOptionPL', () => {
  // ── Long Call ──────────────────────────────────────────────────────────────
  describe('Long Call', () => {
    it('到期价 > 行权价：盈利 = (S - K - premium) × lots × multiplier', () => {
      // S=110, K=100, premium=5, lots=1, multiplier=100
      // intrinsic = 10, pl_per_share = 10 - 5 = 5, total = 500
      const res = calculateOptionPL({ type: 'call', S: 110, K: 100, premium: 5, lots: 1 });
      expect(res.success).toBe(true);
      expect(res.data!.PL).toBe(500);
    });

    it('到期价 < 行权价：亏损权利金', () => {
      // S=90, K=100, premium=5, lots=1, multiplier=100
      // intrinsic = 0, pl_per_share = 0 - 5 = -5, total = -500
      const res = calculateOptionPL({ type: 'call', S: 90, K: 100, premium: 5, lots: 1 });
      expect(res.success).toBe(true);
      expect(res.data!.PL).toBe(-500);
    });

    it('到期价 = 行权价：亏损权利金（虚值）', () => {
      const res = calculateOptionPL({ type: 'call', S: 100, K: 100, premium: 5, lots: 1 });
      expect(res.success).toBe(true);
      expect(res.data!.PL).toBe(-500);
    });

    it('损益平衡价 = K + premium', () => {
      const res = calculateOptionPL({ type: 'call', S: 105, K: 100, premium: 5, lots: 1 });
      expect(res.success).toBe(true);
      expect(res.data!.breakEvenPrice).toBe(105);
    });

    it('多张合约：P&L × lots', () => {
      // S=110, K=100, premium=5, lots=3, pl_per_share=5, total=5×3×100=1500
      const res = calculateOptionPL({ type: 'call', S: 110, K: 100, premium: 5, lots: 3 });
      expect(res.success).toBe(true);
      expect(res.data!.PL).toBe(1500);
    });
  });

  // ── Long Put ──────────────────────────────────────────────────────────────
  describe('Long Put', () => {
    it('到期价 < 行权价：盈利 = (K - S - premium) × lots × multiplier', () => {
      // S=90, K=100, premium=4, lots=1, multiplier=100
      // intrinsic = 10, pl = 10 - 4 = 6, total = 600
      const res = calculateOptionPL({ type: 'put', S: 90, K: 100, premium: 4, lots: 1 });
      expect(res.success).toBe(true);
      expect(res.data!.PL).toBe(600);
    });

    it('到期价 > 行权价：亏损权利金', () => {
      const res = calculateOptionPL({ type: 'put', S: 110, K: 100, premium: 4, lots: 1 });
      expect(res.success).toBe(true);
      expect(res.data!.PL).toBe(-400);
    });

    it('损益平衡价 = K - premium', () => {
      const res = calculateOptionPL({ type: 'put', S: 96, K: 100, premium: 4, lots: 1 });
      expect(res.success).toBe(true);
      expect(res.data!.breakEvenPrice).toBe(96);
    });
  });

  // ── Short Call ─────────────────────────────────────────────────────────────
  describe('Short Call', () => {
    it('到期价 < 行权价：收取权利金（全部盈利）', () => {
      // S=90, K=100, premium=5, lots=1
      // intrinsic=0, pl = 5 - 0 = 5 per share, total = 500
      const res = calculateOptionPL({ type: 'short_call' as any, S: 90, K: 100, premium: 5, lots: 1 });
      expect(res.success).toBe(true);
      expect(res.data!.PL).toBe(500);
    });

    it('到期价 > 行权价：亏损', () => {
      // S=115, K=100, premium=5
      // intrinsic=15, pl = 5 - 15 = -10 per share, total = -1000
      const res = calculateOptionPL({ type: 'short_call' as any, S: 115, K: 100, premium: 5, lots: 1 });
      expect(res.success).toBe(true);
      expect(res.data!.PL).toBe(-1000);
    });
  });

  // ── Short Put ─────────────────────────────────────────────────────────────
  describe('Short Put', () => {
    it('到期价 > 行权价：收取权利金（全部盈利）', () => {
      const res = calculateOptionPL({ type: 'short_put' as any, S: 110, K: 100, premium: 4, lots: 1 });
      expect(res.success).toBe(true);
      expect(res.data!.PL).toBe(400);
    });

    it('到期价 < 行权价：亏损', () => {
      // S=85, K=100, premium=4
      // intrinsic=15, pl = 4 - 15 = -11 per share, total = -1100
      const res = calculateOptionPL({ type: 'short_put' as any, S: 85, K: 100, premium: 4, lots: 1 });
      expect(res.success).toBe(true);
      expect(res.data!.PL).toBe(-1100);
    });
  });

  // ── 自定义乘数 ────────────────────────────────────────────────────────────
  it('自定义合约乘数（50）', () => {
    // S=110, K=100, premium=5, lots=1, multiplier=50
    // pl = (10-5) × 1 × 50 = 250
    const res = calculateOptionPL({ type: 'call', S: 110, K: 100, premium: 5, lots: 1, multiplier: 50 });
    expect(res.success).toBe(true);
    expect(res.data!.PL).toBe(250);
  });

  // ── 输入校验 ──────────────────────────────────────────────────────────────
  it('标的价格为0时返回错误', () => {
    const res = calculateOptionPL({ type: 'call', S: 0, K: 100, premium: 5, lots: 1 });
    expect(res.success).toBe(false);
    expect(res.error?.message).toBeTruthy();
  });

  it('权利金为0时允许（免费期权）', () => {
    const res = calculateOptionPL({ type: 'call', S: 110, K: 100, premium: 0, lots: 1 });
    expect(res.success).toBe(true);
    expect(res.data!.PL).toBe(1000);
  });
});

// ── Payoff Curve ──────────────────────────────────────────────────────────────
describe('generateOptionPayoffCurve', () => {
  it('返回指定点数的数组', () => {
    const curve = generateOptionPayoffCurve('call', 100, 5, 1, 100, 50);
    expect(curve).toHaveLength(50);
  });

  it('Long Call 在行权价以下均为亏损', () => {
    const curve = generateOptionPayoffCurve('call', 100, 5, 1, 100, 50);
    const belowStrike = curve.filter((p) => p.price < 100);
    belowStrike.forEach((p) => {
      expect(p.pl).toBe(-500); // -premium × lots × multiplier
    });
  });

  it('Long Put 在行权价以上均为亏损', () => {
    const curve = generateOptionPayoffCurve('put', 100, 4, 1, 100, 50);
    const aboveStrike = curve.filter((p) => p.price > 100);
    aboveStrike.forEach((p) => {
      expect(p.pl).toBe(-400);
    });
  });

  it('剖面价格从低到高单调排列', () => {
    const curve = generateOptionPayoffCurve('call', 100, 5, 1, 100, 20);
    for (let i = 1; i < curve.length; i++) {
      expect(curve[i].price).toBeGreaterThan(curve[i - 1].price);
    }
  });
});
