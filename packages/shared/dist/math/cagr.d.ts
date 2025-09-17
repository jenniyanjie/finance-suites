/**
 * 模块2: CAGR (复合年均增长率) 计算
 */
import { CAGRInput, CAGRResult, ApiResponse } from '../types';
/**
 * 计算总收益率和年化收益率 (CAGR)
 * 公式：
 * - 总收益率 = (Sell/Buy - 1) * 100%
 * - CAGR = [(Sell/Buy)^(1/Years) - 1] * 100%
 */
export declare const calculateCAGR: (input: CAGRInput) => ApiResponse<CAGRResult>;
/**
 * 反向计算：给定CAGR和其他参数，计算目标价格
 */
export declare const calculateTargetPrice: (currentPrice: number, targetCAGR: number, years: number) => ApiResponse<{
    targetPrice: number;
}>;
/**
 * 反向计算：给定买入价、卖出价，计算达到目标CAGR需要的时间
 */
export declare const calculateRequiredTime: (buyPrice: number, sellPrice: number, targetCAGR: number) => ApiResponse<{
    requiredYears: number;
}>;
/**
 * 批量计算多个投资的CAGR，用于比较
 */
export declare const batchCalculateCAGR: (investments: Array<{
    name: string;
    buy: number;
    sell: number;
    years: number;
}>) => ApiResponse<Array<{
    name: string;
    total: number;
    cagr: number;
    error?: string;
}>>;
