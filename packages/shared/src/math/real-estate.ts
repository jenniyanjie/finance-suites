/**
 * 模块8: 房地产投资收益计算 (杠杆买房)
 */

import { RealEstateInput, RealEstateResult, ApiResponse } from '../types';
import { validateNumber, ValidationError, toCalculationError } from '../utils/validation';

/**
 * 计算杠杆买房收益
 * 
 * 计算逻辑：
 * 1. 自有资金 = 房价 × (1 - 杠杆比例)
 * 2. 贷款金额 = 房价 × 杠杆比例
 * 3. 年租金收入 = 房价 × 租售比
 * 4. 年利息支出 = 贷款金额 × 房贷利率
 * 5. 年净租金收益 = 年租金收入 - 年利息支出
 * 6. 房价上涨收益 = 房价 × 房价年涨幅
 * 7. 年总收益 = 年净租金收益 + 房价上涨收益
 * 8. 年回报率 ROE = 年总收益 / 自有资金
 */
export const calculateRealEstateReturn = (input: RealEstateInput): ApiResponse<RealEstateResult> => {
  try {
    // 输入验证
    validateNumber(input.propertyPrice, '房屋总价', { min: 0.01 });
    validateNumber(input.leverageRatio, '杠杆比例', { min: 0, max: 1, allowZero: true });
    validateNumber(input.loanRate, '房贷利率', { min: 0, max: 50, allowZero: true });
    validateNumber(input.rentYield, '租售比', { min: 0, max: 20, allowZero: true });
    validateNumber(input.priceGrowth, '房价年涨幅', { min: -50, max: 100 });

    // 基础计算
    const equity = input.propertyPrice * (1 - input.leverageRatio);
    const loan = input.propertyPrice * input.leverageRatio;
    const rent = input.propertyPrice * input.rentYield / 100;
    const interest = loan * input.loanRate / 100;
    const netRent = rent - interest;
    const appreciation = input.propertyPrice * input.priceGrowth / 100;
    const totalProfit = netRent + appreciation;

    // 防止除零错误
    if (equity === 0) {
      throw new ValidationError('杠杆比例', '杠杆比例不能为100%，需要有自有资金');
    }

    const roe = (totalProfit / equity) * 100;

    // 检查结果合理性
    if (!isFinite(roe)) {
      throw new ValidationError('结果', '计算结果无效，请检查输入参数');
    }

    return {
      success: true,
      data: {
        equity: Math.round(equity * 100) / 100,
        loan: Math.round(loan * 100) / 100,
        rent: Math.round(rent * 100) / 100,
        interest: Math.round(interest * 100) / 100,
        netRent: Math.round(netRent * 100) / 100,
        appreciation: Math.round(appreciation * 100) / 100,
        totalProfit: Math.round(totalProfit * 100) / 100,
        roe: Math.round(roe * 100) / 100, // 保留2位小数
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
        message: '房地产投资收益计算过程中发生错误',
      },
    };
  }
};

/**
 * 反向计算：给定目标ROE，计算所需的房价涨幅
 */
export const calculateRequiredAppreciation = (
  propertyPrice: number,
  leverageRatio: number,
  loanRate: number,
  rentYield: number,
  targetROE: number
): ApiResponse<{ requiredPriceGrowth: number }> => {
  try {
    validateNumber(propertyPrice, '房屋总价', { min: 0.01 });
    validateNumber(leverageRatio, '杠杆比例', { min: 0, max: 0.99, allowZero: true });
    validateNumber(loanRate, '房贷利率', { min: 0, max: 50, allowZero: true });
    validateNumber(rentYield, '租售比', { min: 0, max: 20, allowZero: true });
    validateNumber(targetROE, '目标ROE', { min: -100, max: 1000 });

    const equity = propertyPrice * (1 - leverageRatio);
    const loan = propertyPrice * leverageRatio;
    const rent = propertyPrice * rentYield / 100;
    const interest = loan * loanRate / 100;
    const netRent = rent - interest;

    // 目标收益 = 自有资金 × 目标ROE
    const targetProfit = equity * targetROE / 100;
    
    // 所需房价上涨收益 = 目标收益 - 净租金收益
    const requiredAppreciation = targetProfit - netRent;
    
    // 所需房价涨幅 = 所需房价上涨收益 / 房价
    const requiredPriceGrowth = (requiredAppreciation / propertyPrice) * 100;

    return {
      success: true,
      data: {
        requiredPriceGrowth: Math.round(requiredPriceGrowth * 100) / 100,
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
        message: '反向计算房价涨幅过程中发生错误',
      },
    };
  }
};

/**
 * 批量对比不同杠杆比例的投资回报
 */
export const batchCompareRealestate = (
  baseInput: Omit<RealEstateInput, 'leverageRatio'>,
  leverageRatios: number[]
): ApiResponse<Array<{ leverageRatio: number; roe: number; totalProfit: number; error?: string }>> => {
  try {
    const results = leverageRatios.map(ratio => {
      const result = calculateRealEstateReturn({
        ...baseInput,
        leverageRatio: ratio,
      });

      if (result.success && result.data) {
        return {
          leverageRatio: ratio,
          roe: result.data.roe,
          totalProfit: result.data.totalProfit,
        };
      } else {
        return {
          leverageRatio: ratio,
          roe: 0,
          totalProfit: 0,
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
        message: '批量对比计算过程中发生错误',
      },
    };
  }
};
