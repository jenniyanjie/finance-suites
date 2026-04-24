/**
 * 模块9: 港股交易费用计算
 * 基于 IBKR 港股交易费率计算买卖费用和净收益
 */
import { TradingCostInput, TradingCostResult, ApiResponse } from '../types';
/**
 * 计算港股交易费用和净收益
 * @param input 交易参数
 * @returns 计算结果
 */
export declare const calculateTradingCost: (input: TradingCostInput) => ApiResponse<TradingCostResult>;
/**
 * 获取 IBKR 港股交易的默认费率设置
 * @returns 默认费率配置
 */
export declare const getDefaultTradingRates: () => Omit<TradingCostInput, "buyPrice" | "sellPrice" | "shares">;
