/**
 * 模块4: 仓位管理 - Kelly准则计算
 *
 * Kelly公式：f* = (b*p - q) / b
 *   f* = 最优仓位比例
 *   b  = 盈利倍数（平均盈利 / 平均亏损）
 *   p  = 胜率（0-1）
 *   q  = 败率 = 1 - p
 *
 * 高风险警告阈值：f* > 0.25（25%）
 * 实践建议：使用半Kelly（f* / 2）以降低波动
 */

import { PositionInput, PositionResult, ApiResponse } from '../types';
import { validateNumber, validateProbability, ValidationError, toCalculationError } from '../utils/validation';

/**
 * 计算Kelly最优仓位
 */
export const calculateKellyPosition = (input: PositionInput): ApiResponse<PositionResult> => {
  try {
    validateProbability(input.p, '胜率');
    validateNumber(input.b, '盈利倍数', { min: 0.01 });

    if (input.p === 0) {
      throw new ValidationError('胜率', '胜率为0时无正期望，不应入场');
    }

    if (input.maxDrawdown !== undefined) {
      validateNumber(input.maxDrawdown, '最大回撤上限', { min: 1, max: 100 });
    }

    const q = 1 - input.p;

    // Kelly公式: f* = (b*p - q) / b
    const kellyRaw = (input.b * input.p - q) / input.b;

    // 负Kelly表示负期望值，不应入场
    if (kellyRaw <= 0) {
      throw new ValidationError(
        '期望值',
        `当前参数的期望值为负（Kelly=${(kellyRaw * 100).toFixed(2)}%），系统无正期望，建议不入场`
      );
    }

    if (!isFinite(kellyRaw)) {
      throw new ValidationError('结果', '计算结果无效，请检查输入参数');
    }

    const kellyPosition = Math.round(kellyRaw * 10000) / 10000; // 保留4位小数
    const isHighRisk = kellyPosition > 0.25;

    const result: PositionResult = {
      kellyPosition,
      isHighRisk,
    };

    // 当提供最大回撤上限时，计算建议仓位区间
    if (input.maxDrawdown !== undefined) {
      // 最大仓位：不超过Kelly的一半（半Kelly），同时受最大回撤限制
      // 最大回撤约 = f * (1 / b + 1)，反推最大安全仓位
      // 简化为：maxSafe = maxDrawdown% / (1 / b * 100 + 100) 近似保守值
      const halfKelly = kellyPosition / 2;
      const maxFromDrawdown = input.maxDrawdown / 100 / (1 / input.b + 1);
      const max = Math.round(Math.min(halfKelly, maxFromDrawdown) * 10000) / 10000;
      const min = Math.round((max / 2) * 10000) / 10000;

      result.suggestedRange = { min, max };
    }

    return { success: true, data: result };
  } catch (error) {
    if (error instanceof ValidationError) {
      return { success: false, error: toCalculationError(error) };
    }
    return {
      success: false,
      error: { code: 'CALCULATION_ERROR', message: 'Kelly仓位计算过程中发生错误' },
    };
  }
};

/**
 * 计算交易系统的期望值 (Expectancy)
 * Expectancy = p * avgWin - q * avgLoss
 * 标准化期望值 = p * R - q  (以平均亏损为1单位)
 */
export const calculateExpectancy = (
  p: number,
  b: number,
  riskAmount: number
): ApiResponse<{ expectancyPerTrade: number; expectancyRatio: number }> => {
  try {
    validateProbability(p, '胜率');
    validateNumber(b, '盈利倍数', { min: 0.01 });
    validateNumber(riskAmount, '每笔风险金额', { min: 0.01 });

    const q = 1 - p;

    // 标准化期望比率（以1单位风险衡量）
    const expectancyRatio = p * b - q;

    // 每笔交易实际期望收益
    const expectancyPerTrade = Math.round(expectancyRatio * riskAmount * 100) / 100;

    return {
      success: true,
      data: {
        expectancyPerTrade,
        expectancyRatio: Math.round(expectancyRatio * 10000) / 10000,
      },
    };
  } catch (error) {
    if (error instanceof ValidationError) {
      return { success: false, error: toCalculationError(error) };
    }
    return {
      success: false,
      error: { code: 'CALCULATION_ERROR', message: '期望值计算过程中发生错误' },
    };
  }
};
