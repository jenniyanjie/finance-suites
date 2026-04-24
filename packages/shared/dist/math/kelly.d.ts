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
/**
 * 计算Kelly最优仓位
 */
export declare const calculateKellyPosition: (input: PositionInput) => ApiResponse<PositionResult>;
/**
 * 计算交易系统的期望值 (Expectancy)
 * Expectancy = p * avgWin - q * avgLoss
 * 标准化期望值 = p * R - q  (以平均亏损为1单位)
 */
export declare const calculateExpectancy: (p: number, b: number, riskAmount: number) => ApiResponse<{
    expectancyPerTrade: number;
    expectancyRatio: number;
}>;
