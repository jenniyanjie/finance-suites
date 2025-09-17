/**
 * 模块2: CAGR (复合年均增长率) 计算
 */

import { CAGRInput, CAGRResult, ApiResponse } from '../types';
import { validateNumber, ValidationError, toCalculationError } from '../utils/validation';

/**
 * 计算总收益率和年化收益率 (CAGR)
 * 公式：
 * - 总收益率 = (Sell/Buy - 1) * 100%
 * - CAGR = [(Sell/Buy)^(1/Years) - 1] * 100%
 */
export const calculateCAGR = (input: CAGRInput): ApiResponse<CAGRResult> => {
  try {
    // 输入验证
    validateNumber(input.buy, '买入价', { min: 0.01 });
    validateNumber(input.sell, '卖出价', { min: 0.01 });
    validateNumber(input.years, '持有年限', { min: 0.001 }); // 最小支持0.001年(约8.76小时)

    // 计算总收益率
    const totalReturn = (input.sell / input.buy - 1);

    // 计算CAGR
    const cagr = Math.pow(input.sell / input.buy, 1 / input.years) - 1;

    // 检查结果是否合理
    if (!isFinite(totalReturn) || !isFinite(cagr)) {
      throw new ValidationError('结果', '计算结果无效，请检查输入参数');
    }

    return {
      success: true,
      data: {
        total: Math.round(totalReturn * 10000) / 100, // 转换为百分比，保留2位小数
        cagr: Math.round(cagr * 10000) / 100, // 转换为百分比，保留2位小数
      },
    };
  } catch (error) {
    if (error instanceof ValidationError) {
      return {
        success: false,
        error: toCalculationError(error),
      };
    }

    return {
      success: false,
      error: {
        code: 'CALCULATION_ERROR',
        message: 'CAGR计算过程中发生错误',
      },
    };
  }
};

/**
 * 反向计算：给定CAGR和其他参数，计算目标价格
 */
export const calculateTargetPrice = (
  currentPrice: number,
  targetCAGR: number,
  years: number
): ApiResponse<{ targetPrice: number }> => {
  try {
    validateNumber(currentPrice, '当前价格', { min: 0.01 });
    validateNumber(targetCAGR, '目标CAGR', { min: -99.99, max: 1000 });
    validateNumber(years, '投资年限', { min: 0.001, allowZero: false });

    // 转换百分比为小数
    const rate = targetCAGR / 100;

    // 计算目标价格: Target = Current * (1 + CAGR)^years
    const targetPrice = currentPrice * Math.pow(1 + rate, years);

    if (!isFinite(targetPrice) || targetPrice < 0) {
      throw new ValidationError('结果', '计算结果无效，请检查输入参数');
    }

    return {
      success: true,
      data: {
        targetPrice: Math.round(targetPrice * 100) / 100,
      },
    };
  } catch (error) {
    if (error instanceof ValidationError) {
      return {
        success: false,
        error: toCalculationError(error),
      };
    }

    return {
      success: false,
      error: {
        code: 'CALCULATION_ERROR',
        message: '目标价格计算过程中发生错误',
      },
    };
  }
};

/**
 * 反向计算：给定买入价、卖出价，计算达到目标CAGR需要的时间
 */
export const calculateRequiredTime = (
  buyPrice: number,
  sellPrice: number,
  targetCAGR: number
): ApiResponse<{ requiredYears: number }> => {
  try {
    validateNumber(buyPrice, '买入价', { min: 0.01 });
    validateNumber(sellPrice, '卖出价', { min: 0.01 });
    validateNumber(targetCAGR, '目标CAGR', { min: -99.99, max: 1000 });

    const rate = targetCAGR / 100;
    
    if (rate <= -1) {
      throw new ValidationError('目标CAGR', '目标CAGR不能小于等于-100%');
    }

    // 计算需要的时间: Years = ln(Sell/Buy) / ln(1 + CAGR)
    const priceRatio = sellPrice / buyPrice;
    
    if (priceRatio <= 0) {
      throw new ValidationError('价格', '价格比值必须大于0');
    }

    if (priceRatio === 1 && rate !== 0) {
      throw new ValidationError('参数', '当买入价等于卖出价时，目标CAGR必须为0');
    }

    if (rate === 0) {
      if (priceRatio === 1) {
        return {
          success: true,
          data: { requiredYears: 0 },
        };
      } else {
        throw new ValidationError('参数', '当目标CAGR为0时，买入价必须等于卖出价');
      }
    }

    const requiredYears = Math.log(priceRatio) / Math.log(1 + rate);

    if (!isFinite(requiredYears) || requiredYears < 0) {
      throw new ValidationError('结果', '无法达到目标CAGR，请检查参数设置');
    }

    return {
      success: true,
      data: {
        requiredYears: Math.round(requiredYears * 1000) / 1000, // 保留3位小数
      },
    };
  } catch (error) {
    if (error instanceof ValidationError) {
      return {
        success: false,
        error: toCalculationError(error),
      };
    }

    return {
      success: false,
      error: {
        code: 'CALCULATION_ERROR',
        message: '所需时间计算过程中发生错误',
      },
    };
  }
};

/**
 * 批量计算多个投资的CAGR，用于比较
 */
export const batchCalculateCAGR = (
  investments: Array<{ name: string; buy: number; sell: number; years: number }>
): ApiResponse<Array<{ name: string; total: number; cagr: number; error?: string }>> => {
  try {
    const results = investments.map(investment => {
      const result = calculateCAGR({
        buy: investment.buy,
        sell: investment.sell,
        years: investment.years,
      });

      if (result.success && result.data) {
        return {
          name: investment.name,
          total: result.data.total,
          cagr: result.data.cagr,
        };
      } else {
        return {
          name: investment.name,
          total: 0,
          cagr: 0,
          error: result.error?.message || '计算失败',
        };
      }
    });

    return {
      success: true,
      data: results,
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'BATCH_CALCULATION_ERROR',
        message: '批量计算过程中发生错误',
      },
    };
  }
};
