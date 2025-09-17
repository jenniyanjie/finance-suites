/**
 * 模块8: 房地产投资收益计算 (杠杆买房)
 */
import { RealEstateInput, RealEstateResult, ApiResponse } from '../types';
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
export declare const calculateRealEstateReturn: (input: RealEstateInput) => ApiResponse<RealEstateResult>;
/**
 * 反向计算：给定目标ROE，计算所需的房价涨幅
 */
export declare const calculateRequiredAppreciation: (propertyPrice: number, leverageRatio: number, loanRate: number, rentYield: number, targetROE: number) => ApiResponse<{
    requiredPriceGrowth: number;
}>;
/**
 * 批量对比不同杠杆比例的投资回报
 */
export declare const batchCompareRealestate: (baseInput: Omit<RealEstateInput, "leverageRatio">, leverageRatios: number[]) => ApiResponse<Array<{
    leverageRatio: number;
    roe: number;
    totalProfit: number;
    error?: string;
}>>;
