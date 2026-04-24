/**
 * 模块5: 期权盈亏计算
 *
 * 支持买入/卖出 Call/Put 四个方向的到期盈亏计算，
 * 以及 P&L 剖面数据（payoff curve）。
 *
 * 到期时：
 *   Long Call:  P&L = max(S - K, 0) - premium       per share
 *   Long Put:   P&L = max(K - S, 0) - premium       per share
 *   Short Call: P&L = premium - max(S - K, 0)       per share
 *   Short Put:  P&L = premium - max(K - S, 0)       per share
 *
 * 总 P&L = P&L per share × lots × multiplier
 */

import { OptionInput, OptionResult, ApiResponse } from '../types';
import { validateNumber, ValidationError, toCalculationError } from '../utils/validation';

const round2 = (v: number) => Math.round(v * 100) / 100;

/**
 * 计算单一期权头寸在给定标的价格下的到期盈亏
 */
const payoffPerShare = (
  type: 'call' | 'put',
  direction: 'long' | 'short',
  S: number,
  K: number,
  premium: number,
): number => {
  const intrinsic = type === 'call' ? Math.max(S - K, 0) : Math.max(K - S, 0);
  return direction === 'long' ? intrinsic - premium : premium - intrinsic;
};

/**
 * 计算期权到期盈亏与损益平衡价
 *
 * input.type: 'call' | 'put'      — 期权类型
 * input.S:    当前标的价格（用来作为参考，计算当前持仓P&L）
 * input.K:    行权价
 * input.premium: 权利金（每股/单位）
 * input.lots:    张数
 * input.multiplier: 合约乘数（默认100）
 */
export const calculateOptionPL = (input: OptionInput): ApiResponse<OptionResult> => {
  try {
    validateNumber(input.S, '标的价格', { min: 0.01 });
    validateNumber(input.K, '行权价', { min: 0.01 });
    validateNumber(input.premium, '权利金', { min: 0 });
    validateNumber(input.lots, '张数', { min: 1 });

    const multiplier = input.multiplier ?? 100;
    if (multiplier <= 0) {
      throw new ValidationError('合约乘数', '合约乘数必须大于0');
    }

    // 从 type 推断 direction（OptionInput 中 type 包含方向信息）
    // 类型定义: 'call' | 'put' 表示买入方向（long）
    // 扩展支持: 'short_call' | 'short_put'
    const rawType = input.type as string;
    let direction: 'long' | 'short' = 'long';
    let optionType: 'call' | 'put';

    if (rawType === 'short_call') {
      direction = 'short';
      optionType = 'call';
    } else if (rawType === 'short_put') {
      direction = 'short';
      optionType = 'put';
    } else {
      optionType = input.type as 'call' | 'put';
    }

    // 到期时在当前标的价格 S 下的盈亏
    const plPerShare = payoffPerShare(optionType, direction, input.S, input.K, input.premium);
    const PL = round2(plPerShare * input.lots * multiplier);

    // 损益平衡价（到期时 P&L = 0）
    let breakEvenPrice: number;
    if (optionType === 'call') {
      breakEvenPrice = direction === 'long'
        ? round2(input.K + input.premium)
        : round2(input.K + input.premium);
    } else {
      breakEvenPrice = direction === 'long'
        ? round2(input.K - input.premium)
        : round2(input.K - input.premium);
    }

    return {
      success: true,
      data: { PL, breakEvenPrice },
    };
  } catch (error) {
    if (error instanceof ValidationError) {
      return { success: false, error: toCalculationError(error) };
    }
    return {
      success: false,
      error: { code: 'CALCULATION_ERROR', message: '期权盈亏计算过程中发生错误' },
    };
  }
};

/**
 * 生成期权到期盈亏剖面数据（用于绘图）
 *
 * @param type       期权方向类型：'call' | 'put' | 'short_call' | 'short_put'
 * @param K          行权价
 * @param premium    权利金（每股）
 * @param lots       张数
 * @param multiplier 合约乘数（默认100）
 * @param points     剖面点数（默认50）
 * @returns          Array<{ price: number; pl: number }>
 */
export const generateOptionPayoffCurve = (
  type: string,
  K: number,
  premium: number,
  lots: number,
  multiplier = 100,
  points = 50,
): Array<{ price: number; pl: number }> => {
  const rawType = type as string;
  let direction: 'long' | 'short' = 'long';
  let optionType: 'call' | 'put';

  if (rawType === 'short_call') {
    direction = 'short';
    optionType = 'call';
  } else if (rawType === 'short_put') {
    direction = 'short';
    optionType = 'put';
  } else {
    optionType = type as 'call' | 'put';
  }

  // 剖面价格范围：行权价 ± 50%
  const minPrice = Math.max(0.01, K * 0.5);
  const maxPrice = K * 1.5;
  const step = (maxPrice - minPrice) / (points - 1);

  return Array.from({ length: points }, (_, i) => {
    const price = round2(minPrice + step * i);
    const plPerShare = payoffPerShare(optionType, direction, price, K, premium);
    const pl = round2(plPerShare * lots * multiplier);
    return { price, pl };
  });
};
